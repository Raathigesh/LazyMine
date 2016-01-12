/*global require, module, setInterval, setTimeout, clearInterval, console*/
var AppConstants = require('../constants/app-action-name'),
    AppEvent = require('../constants/app-event'),
    AppDispatcher = require('../dispatchers/app-dispatcher'),
    merge = require('react/lib/Object.assign'),
    EventEmitter = require('events').EventEmitter,
    settings = require('./settings-manager'),
    DataManager = require('./data-manager'),
    ServiceAccessor = require('./service-accessor'),
    HttpHelper = require('./http-helper'),
    StoreError = require('../constants/store-errors'),
    StoreMessage = require('../constants/store-message'),
    $ = require("jquery"),
    dataManager = null,
    Rx = require('rx'),
    GoogleAnalytics = require('../util/googleAnalytics'),
    GoogleAnalyticsObj = new GoogleAnalytics(),
    LoadingStatus = require('./loading-status'),
    moment = require('moment'),
    _ = require('lodash');

var getDataManager = function () {
    "use strict";
    if ((dataManager === null || settings.forceLoad) && settings.available) {
        settings.forceLoad = false;
        dataManager = new DataManager(new ServiceAccessor(settings.BaseURL, new HttpHelper(settings.APIKey)));
    }

    return dataManager;
};

module.exports = merge(EventEmitter.prototype, (function () {
    "use strict";
    var State = {
            fetchInProgress: false, // denotes weather issues are being fetched.
            filteredResult: [], // filtered search results.
            activeItems: [], // active tasks selected by the user.
            activities: [], // activities available to enter time against. Fetched from server.
            loadingStatus: new LoadingStatus(),
            timeEntryCollection: null,
            settings: settings,
            error: null,
            updateVersion: null,
            updateInstalled: false
        },
        subject = new Rx.Subject(),
        subscription = subject.debounce(500).subscribe(
            function () {
                settings.setTaskCollection(manager.activeTaskCollection);
            }.bind(this),
            function (err) {
                console.log('Error: ' + err);
            },
            function () {
                console.log('Completed');
            }),
        showToast = function (error) {
            State.error = error;
            EventEmitter.prototype.emit(AppEvent.Change);
        },
        clearError = function () {
            State.error = null;
            EventEmitter.prototype.emit(AppEvent.Change);
        },
        getState = function () {
            return State;
        },
        fetchLatestBackground = function () {
            var intervalId = setInterval(function () {
                try {
                    var manager = getDataManager();
                    if (manager !== null) {
                        if (!State.loadingStatus.isLoading()) {
                            GoogleAnalyticsObj.trackPageView('/index.html');
                            $.when(manager.fetchLatest()).fail(function (error) {
                                showToast.call(this, error);
                            }.bind(this));
                        }
                    } else {
                        clearInterval(intervalId);
                    }
                } catch (error) {
                    showToast.call(this, StoreError.InternalServerError);
                    console.error(error);
                }
            }.bind(this), settings.backgroundFetchTimerInterval);
        },
        fetchLatest = function () {
            try {
                var manager = getDataManager();
                if (State.loadingStatus.isLoading()) {
                    showToast.call(this, StoreError.DataFetchInProgress);
                    return null;
                }
                if (manager !== null) {
                    State.loadingStatus.setLoading("fetchLatest");
                    State.filteredResult = [];
                    clearError.call(this);
                    $.when(manager.fetchData()).done(function () {
                        State.loadingStatus.setLoaded("fetchLatest");
                        EventEmitter.prototype.emit(AppEvent.Change);
                    }.bind(this)).fail(function (error) {
                        showToast.call(this, error);
                        State.loadingStatus.setLoaded("fetchLatest");
                        setTimeout(function () {
                            fetchLatest.call(this);
                        }.bind(this), settings.retryInterval);
                    }.bind(this));
                }
            } catch (error) {
                showToast.call(this, StoreError.InternalServerError);
                console.error(error);
            }
        },
        fetchData = function () {
            try {
                var manager = getDataManager();
                if (manager !== null) {
                    clearError.call(this);
                    State.loadingStatus.setLoading("fetchData");
                    $.when(manager.fetchData()).done(function () {
                        State.loadingStatus.setLoaded("fetchData");
                        State.filteredResult = [];
                        manager.activityCollection.map(function (item) {
                            State.activities.push({
                                id: item.id,
                                text: item.name
                            });
                        }.bind(this));

                        if (settings.fetchTaskCollection()) {
                            manager.createActiveTaskCollection(settings.activeTaskCollection);
                            State.activeItems = manager.activeTaskCollection;
                        }
                        getTimeEntries.call(this, moment());
                        fetchLatestBackground.call(this);
                        EventEmitter.prototype.emit(AppEvent.Change);
                    }.bind(this)).fail(function (error) {
                        showToast.call(this, error);
                        State.loadingStatus.setLoaded("fetchData");
                        setTimeout(function () {
                            fetchData.call(this);
                        }.bind(this), settings.retryInterval);
                    }.bind(this));
                }
            } catch (error) {
                showToast.call(this, StoreError.InternalServerError);
                console.error(error);
            }
        },
        filterTaskCollection = function (query) {
            try {
                var manager = getDataManager();
                if (!State.loadingStatus.isLoading() && manager !== null) {
                    State.filteredResult = manager.filterTaskCollection(query);
                    EventEmitter.prototype.emit(AppEvent.Change);
                }
            } catch (error) {
                showToast.call(this, StoreError.InternalServerError);
                console.error(error);
            }
        },
        clearSearch = function () {
            try {
                State.filteredResult = [];
                EventEmitter.prototype.emit(AppEvent.Change);
            } catch (error) {
                showToast.call(this, StoreError.InternalServerError);
                console.error(error);
            }
        },
        createActiveTask = function (issueId) {
            try {
                if (!issueId) {
                    return null;
                }

                var manager = getDataManager();
                if (manager !== null) {
                    manager.createActiveTask(issueId);
                    settings.setTaskCollection(manager.activeTaskCollection);
                    State.activeItems = manager.activeTaskCollection;
                    EventEmitter.prototype.emit(AppEvent.Change);
                }
            } catch (error) {
                showToast.call(this, StoreError.InternalServerError);
                console.error(error);
            }
        },
        updateActiveTaskActivityId = function (entry) {
            try {
                var manager = getDataManager();
                if (manager !== null) {
                    manager.updateActiveTaskActivityId(entry.id, entry.activityId);
                    settings.setTaskCollection(manager.activeTaskCollection);
                    EventEmitter.prototype.emit(AppEvent.Change);
                }
            } catch (error) {
                showToast.call(this, StoreError.InternalServerError);
                console.error(error);
            }
        },
        updateActiveTaskComments = function (entry) {
            try {
                var manager = getDataManager();
                if (manager !== null) {
                    manager.updateActiveTaskComments(entry.id, entry.comments);
                    subject.onNext();
                    EventEmitter.prototype.emit(AppEvent.Change);
                }
            } catch (error) {
                showToast.call(this, StoreError.InternalServerError);
                console.error(error);
            }
        },
        updateActiveTaskHours = function (entry) {
            try {
                var manager = getDataManager();
                if (manager !== null) {
                    manager.updateActiveTaskHours(entry.id, entry.hours);
                    settings.setTaskCollection(manager.activeTaskCollection);
                    EventEmitter.prototype.emit(AppEvent.Change);
                }
            } catch (error) {
                showToast.call(this, StoreError.InternalServerError);
                console.error(error);
            }
        },
        updateActiveTaskCustomField = function (entry) {
            try {
                var manager = getDataManager();
                if (manager !== null) {
                    manager.updateActiveTaskCustomField(entry.id, entry.customFieldId, entry.customFieldValue);
                    settings.setTaskCollection(manager.activeTaskCollection);
                    EventEmitter.prototype.emit(AppEvent.Change);
                }
            } catch (error) {
                showToast.call(this, StoreError.InternalServerError);
                console.error(error);
            }
        },
        removeActiveTask = function (entryId) {
            try {
                var manager = getDataManager();
                if (manager !== null) {
                    manager.removeActiveTask(entryId);
                    settings.setTaskCollection(manager.activeTaskCollection);
                    EventEmitter.prototype.emit(AppEvent.Change);
                }
            } catch (error) {
                showToast.call(this, StoreError.InternalServerError);
                console.error(error);
            }
        },
        postUpdatedActiveTaskCollection = function (spentOn) {
            try {
                var manager = getDataManager();
                if (manager !== null) {
                    $.when(manager.postUpdatedActiveTaskCollection(spentOn)).done(function () {
                        settings.setTaskCollection(manager.activeTaskCollection);
                        showToast.call(this, StoreMessage.TimeUpdateSuccessful);
                        //call update weekly summary view
                        getTimeEntries.call(this, spentOn);
                    }.bind(this)).fail(function (error) {
                        showToast.call(this, error);
                    }.bind(this));
                }
            } catch (error) {
                showToast.call(this, StoreError.InternalServerError);
                console.error(error);
            }
        },
        clearActiveTaskCollection = function () {
            try {
                var manager = getDataManager();
                if (manager !== null) {
                    manager.clearActiveTaskCollection();
                    State.activeItems = manager.activeTaskCollection;
                    settings.setTaskCollection(manager.activeTaskCollection);
                    EventEmitter.prototype.emit(AppEvent.Change);
                }
            } catch (error) {
                showToast.call(this, StoreError.InternalServerError);
                console.error(error);
            }
        },
        setSettings = function (data) {
            try {
                $.when(settings.setSettings(data.url, data.apiKey)).done(function () {
                    EventEmitter.prototype.emit(AppEvent.Change);
                }.bind(this)).fail(function (error) {
                    showToast.call(this, error);
                }.bind(this));
            } catch (error) {
                showToast.call(this, StoreError.InternalServerError);
                console.error(error);
            }
        },
        resetState = function () {
            State = {
                fetchInProgress: false,
                filteredResult: [],
                activeItems: [],
                activities: [],
                settings: settings,
                error: null
            };
        },
        clearSettings = function () {
            try {
                settings.clearSettings();
                resetState.call(this);
                location.reload();
            } catch (error) {
                showToast.call(this, StoreError.InternalServerError);
                console.error(error);
            }
        },
        getTimeEntries = function (spentOn){
            try {
                var manager = getDataManager();
               /* if (State.isLoading) {
                    showToast.call(this, StoreError.DataFetchInProgress);
                    return null;
                }  */
                if (manager !== null) {
                    State.loadingStatus.setLoading("getTimeEntries");
                    State.filteredResult = [];
                    clearError.call(this);
                    $.when(manager.getTimeEntryRange(spentOn, 7)).done(function (data) {
                        State.timeEntryCollection = data;
                        State.loadingStatus.setLoaded("getTimeEntries");
                        EventEmitter.prototype.emit(AppEvent.Change);
                    }.bind(this)).fail(function (error) {
                        showToast.call(this, error);
                        State.loadingStatus.setLoaded("getTimeEntries");
                        setTimeout(function () {
                            getTimeEntries.call(this);
                        }.bind(this), settings.retryInterval);
                    }.bind(this));
                }
            } catch (error) {
                showToast.call(this, StoreError.InternalServerError);
                console.error(error);
            }
        },
        deleteTimeEntry = function (timeEntryId) {
          try {
              var manager = getDataManager();
              $.when(manager.deleteTimeEntry(timeEntryId)).done(function () {
                 // do when deleted
                  _.map(State.timeEntryCollection, function (entryDay) {
                      _.remove(entryDay.data, function(timeEntry) {
                          return timeEntry.id === timeEntryId;
                      });
                  });

                  EventEmitter.prototype.emit(AppEvent.Change);
              }.bind(this)).fail(function (error) {
                  showToast.call(this, StoreError.InternalServerError);
              }.bind(this));
          } catch (error) {
              showToast.call(this, StoreError.InternalServerError);
              console.error(error);
          }
        },
        updateAvilable = function(version) {
            State.updateVersion = version;
            EventEmitter.prototype.emit(AppEvent.Change);
        },
        updateInstalled = function() {
          State.updateVersion = null;
          State.updateInstalled = true;
          EventEmitter.prototype.emit(AppEvent.Change);
        },
        addChangeListener = function (callback) {
            EventEmitter.prototype.on(AppEvent.Change, callback);
        },
        removeChangeListeners = function (callback) {
            EventEmitter.prototype.removeListener(AppEvent.Change, callback);
        },
        dispatcherIndex = AppDispatcher.register(function (payload) {
            // Clear the current error as its shown to the user already.
            State.error = null;

            var action = payload.action;
            switch (action.actionType) {
            case AppConstants.FetchIssues:
                fetchData.call(this);
                break;
            case AppConstants.Search:
                filterTaskCollection.call(this, action.query);
                break;
            case AppConstants.ClearSearch:
                clearSearch.call();
                break;
            case AppConstants.AddIssue:
                createActiveTask.call(this, action.issueId);
                break;
            case AppConstants.UpdateTaskActivityId:
                updateActiveTaskActivityId.call(this, action.entry);
                break;
            case AppConstants.UpdateTaskComments:
                updateActiveTaskComments.call(this, action.entry);
                break;
            case AppConstants.UpdateTaskHours:
                updateActiveTaskHours.call(this, action.entry);
                break;
            case AppConstants.UpdateTaskCustomField:
                updateActiveTaskCustomField.call(this, action.entry);
                break;
            case AppConstants.CreateTimeEntries:
                postUpdatedActiveTaskCollection.call(this, action.spentOn);
                break;
            case AppConstants.ClearTimeEntries:
                clearActiveTaskCollection.call(this);
                break;
            case AppConstants.SaveSettings:
                setSettings.call(this, action.settings);
                break;
            case AppConstants.RemoveTimeEntry:
                removeActiveTask.call(this, action.taskId);
                break;
            case AppConstants.RefreshIssues:
                fetchLatest.call(this);
                break;
            case AppConstants.Logout:
                clearSettings.call(this);
                break;
            case AppConstants.UpdateTaskCustomField:
                updateActiveTaskCustomField.call(this, action.entry);
                break;
            case AppConstants.GetTimeEntries:
                getTimeEntries.call(this, action.spentOn);
                break;
            case AppConstants.DeleteTimeEntry:
                deleteTimeEntry.call(this, action.timeEntryId);
                break;
            case AppConstants.UpdateAvilable:
                updateAvilable.call(this, action.version);
                break;
            case AppConstants.UpdateInstalled:
                updateInstalled.call(this);
                break;
            }
        });

    return {
        getState: getState,
        addChangeListener: addChangeListener,
        removeChangeListeners: removeChangeListeners,
        dispatcherIndex: dispatcherIndex
    };
}()));
