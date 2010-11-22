////////////////////////////////////////////////////////////////////
//                          caap OBJECT
// this is the main object for the game, containing all methods, globals, etc.
/////////////////////////////////////////////////////////////////////

caap = {
    lastReload          : new Date().getTime(),
    pageLoadCounter     : 0,
    flagReload          : false,
    waitingForDomLoad   : false,
    pageLoadOK          : false,
    caapDivObject       : null,
    caapTopObject       : null,
    documentTitle       : document.title,
    newVersionAvailable : false,

    IncrementPageLoadCounter: function () {
        try {
            this.pageLoadCounter += 1;
            utility.log(2, "pageLoadCounter", this.pageLoadCounter);
            return this.pageLoadCounter;
        } catch (err) {
            utility.error("ERROR in IncrementPageLoadCounter: " + err);
            return undefined;
        }
    },

    releaseUpdate: function () {
        try {
            if (state.getItem('SUC_remote_version', 0) > caapVersion) {
                this.newVersionAvailable = true;
            }

            // update script from: http://castle-age-auto-player.googlecode.com/files/Castle-Age-Autoplayer.user.js
            function updateCheck(forced) {
                if (forced || schedule.check('SUC_last_update')) {
                    try {
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: 'http://castle-age-auto-player.googlecode.com/files/Castle-Age-Autoplayer.user.js',
                            headers: {'Cache-Control': 'no-cache'},
                            onload: function (resp) {
                                var remote_version = resp.responseText.match(new RegExp("@version\\s*(.*?)\\s*$", "m"))[1],
                                    script_name    = resp.responseText.match(new RegExp("@name\\s*(.*?)\\s*$", "m"))[1];

                                schedule.setItem('SUC_last_update', 86400000);
                                state.setItem('SUC_target_script_name', script_name);
                                state.setItem('SUC_remote_version', remote_version);
                                utility.log(1, 'Remote version ', remote_version);
                                if (remote_version > caapVersion) {
                                    caap.newVersionAvailable = true;
                                    if (forced) {
                                        if (confirm('There is an update available for the Greasemonkey script "' + script_name + '."\nWould you like to go to the install page now?')) {
                                            GM_openInTab('http://senses.ws/caap/index.php?topic=771.msg3582#msg3582');
                                        }
                                    }
                                } else if (forced) {
                                    alert('No update is available for "' + script_name + '."');
                                }
                            }
                        });
                    } catch (err) {
                        if (forced) {
                            alert('An error occurred while checking for updates:\n' + err);
                        }
                    }
                }
            }

            GM_registerMenuCommand(state.getItem('SUC_target_script_name', '???') + ' - Manual Update Check', function () {
                updateCheck(true);
            });

            updateCheck(false);
        } catch (err) {
            utility.error("ERROR in release updater: " + err);
        }
    },

    devUpdate: function () {
        try {
            if (state.getItem('SUC_remote_version', 0) > caapVersion || (state.getItem('SUC_remote_version', 0) >= caapVersion && state.getItem('DEV_remote_version', 0) > devVersion)) {
                this.newVersionAvailable = true;
            }

            // update script from: http://castle-age-auto-player.googlecode.com/svn/trunk/Castle-Age-Autoplayer.user.js
            function updateCheck(forced) {
                if (forced || schedule.check('SUC_last_update')) {
                    try {
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: 'http://castle-age-auto-player.googlecode.com/svn/trunk/Castle-Age-Autoplayer.user.js',
                            headers: {'Cache-Control': 'no-cache'},
                            onload: function (resp) {
                                var remote_version = resp.responseText.match(new RegExp("@version\\s*(.*?)\\s*$", "m"))[1],
                                    dev_version    = resp.responseText.match(new RegExp("@dev\\s*(.*?)\\s*$", "m"))[1],
                                    script_name    = resp.responseText.match(new RegExp("@name\\s*(.*?)\\s*$", "m"))[1];

                                schedule.setItem('SUC_last_update', 86400000);
                                state.setItem('SUC_target_script_name', script_name);
                                state.setItem('SUC_remote_version', remote_version);
                                state.setItem('DEV_remote_version', dev_version);
                                utility.log(1, 'Remote version ', remote_version, dev_version);
                                if (remote_version > caapVersion || (remote_version >= caapVersion && dev_version > devVersion)) {
                                    caap.newVersionAvailable = true;
                                    if (forced) {
                                        if (confirm('There is an update available for the Greasemonkey script "' + script_name + '."\nWould you like to go to the install page now?')) {
                                            GM_openInTab('http://code.google.com/p/castle-age-auto-player/updates/list');
                                        }
                                    }
                                } else if (forced) {
                                    alert('No update is available for "' + script_name + '."');
                                }
                            }
                        });
                    } catch (err) {
                        if (forced) {
                            alert('An error occurred while checking for updates:\n' + err);
                        }
                    }
                }
            }

            GM_registerMenuCommand(state.getItem('SUC_target_script_name', '???') + ' - Manual Update Check', function () {
                updateCheck(true);
            });

            updateCheck(false);
        } catch (err) {
            utility.error("ERROR in development updater: " + err);
        }
    },

    init: function () {
        try {
            state.setItem(this.friendListType.gifta.name + 'Requested', false);
            state.setItem(this.friendListType.giftc.name + 'Requested', false);
            state.setItem(this.friendListType.facebook.name + 'Requested', false);
            // Get rid of those ads now! :P
            if (config.getItem('HideAds', false)) {
                $('.UIStandardFrame_SidebarAds').css('display', 'none');
            }

            if (config.getItem('HideAdsIframe', false)) {
                $("iframe[name*='fb_iframe']").eq(0).parent().css('display', 'none');
            }

            if (config.getItem('HideFBChat', false)) {
                window.setTimeout(function () {
                    $("div[class*='fbDockWrapper fbDockWrapperBottom fbDockWrapperRight']").css('display', 'none');
                }, 100);
            }

            // Can create a blank space above the game to host the dashboard if wanted.
            // Dashboard currently uses '185px'
            var shiftDown = gm.getItem('ShiftDown', '', hiddenVar);
            if (shiftDown) {
                $(this.controlXY.selector).css('padding-top', shiftDown);
            }

            general.load();
            monster.load();
            guild_monster.load();
            battle.load();
            this.LoadDemi();
            this.LoadRecon();
            town.load('soldiers');
            town.load('item');
            town.load('magic');
            spreadsheet.load();
            this.AddControl();
            this.AddColorWheels();
            this.AddDashboard();
            this.AddListeners();
            this.AddDBListener();
            this.CheckResults();
            this.AutoStatCheck();
            return true;
        } catch (err) {
            utility.error("ERROR in init: " + err);
            return false;
        }
    },

    /////////////////////////////////////////////////////////////////////
    //                          DISPLAY FUNCTIONS
    // these functions set up the control applet and allow it to be changed
    /////////////////////////////////////////////////////////////////////

    defaultDropDownOption: "<option disabled='disabled' value='not selected'>Choose one</option>",

    MakeDropDown: function (idName, dropDownList, instructions, formatParms, defaultValue) {
        try {
            var selectedItem = config.getItem(idName, 'defaultValue'),
                count        = 0,
                itemcount    = 0,
                htmlCode     = '',
                item         = 0;

            if (selectedItem === 'defaultValue') {
                if (defaultValue) {
                    selectedItem = config.setItem(idName, defaultValue);
                } else {
                    selectedItem = config.setItem(idName, dropDownList[0]);
                }
            }

            for (itemcount in dropDownList) {
                if (dropDownList.hasOwnProperty(itemcount)) {
                    if (selectedItem === dropDownList[itemcount]) {
                        break;
                    }

                    count += 1;
                }
            }

            htmlCode = "<select id='caap_" + idName + "' " + ((instructions[count]) ? " title='" + instructions[count] + "' " : '') + formatParms + ">";
            htmlCode += this.defaultDropDownOption;
            for (item = 0; item < dropDownList.length; item += 1) {
                if (instructions) {
                    htmlCode += "<option value='" + dropDownList[item] +
                        "'" + ((selectedItem === dropDownList[item]) ? " selected='selected'" : '') +
                        ((instructions[item]) ? " title='" + instructions[item] + "'" : '') + ">" +
                        dropDownList[item] + "</option>";
                } else {
                    htmlCode += "<option value='" + dropDownList[item] +
                        "'" + ((selectedItem === dropDownList[item]) ? " selected='selected'" : '') + ">" +
                        dropDownList[item] + "</option>";
                }
            }

            htmlCode += '</select>';
            return htmlCode;
        } catch (err) {
            utility.error("ERROR in MakeDropDown: " + err);
            return '';
        }
    },

    /*-------------------------------------------------------------------------------------\
    DBDropDown is used to make our drop down boxes for dash board controls.  These require
    slightly different HTML from the side controls.
    \-------------------------------------------------------------------------------------*/
    DBDropDown: function (idName, dropDownList, instructions, formatParms) {
        try {
            var selectedItem = config.getItem(idName, 'defaultValue'),
                htmlCode     = '',
                item         = 0;
            if (selectedItem === 'defaultValue') {
                selectedItem = config.setItem(idName, dropDownList[0]);
            }

            htmlCode = " <select id='caap_" + idName + "' " + formatParms + "'><option>" + selectedItem;
            for (item = 0; item < dropDownList.length; item += 1) {
                if (selectedItem !== dropDownList[item]) {
                    if (instructions) {
                        htmlCode += "<option value='" + dropDownList[item] + "' " + ((instructions[item]) ? " title='" + instructions[item] + "'" : '') + ">"  + dropDownList[item];
                    } else {
                        htmlCode += "<option value='" + dropDownList[item] + "'>" + dropDownList[item];
                    }
                }
            }

            htmlCode += '</select>';
            return htmlCode;
        } catch (err) {
            utility.error("ERROR in DBDropDown: " + err);
            return '';
        }
    },

    MakeCheckBox: function (idName, defaultValue, varClass, instructions, tableTF) {
        try {
            var checkItem = config.getItem(idName, 'defaultValue'),
                htmlCode  = '';

            if (checkItem === 'defaultValue') {
                config.setItem(idName, defaultValue);
            }

            htmlCode = "<input type='checkbox' id='caap_" + idName + "' title=" + '"' + instructions + '"' + ((varClass) ? " class='" + varClass + "'" : '') + (config.getItem(idName) ? 'checked' : '') + ' />';
            if (varClass) {
                if (tableTF) {
                    htmlCode += "</td></tr></table>";
                } else {
                    htmlCode += '<br />';
                }

                htmlCode += this.AddCollapsingDiv(idName, varClass);
            }

            return htmlCode;
        } catch (err) {
            utility.error("ERROR in MakeCheckBox: " + err);
            return '';
        }
    },

    MakeNumberForm: function (idName, instructions, initDefault, formatParms, subtype) {
        try {
            if (!subtype) {
                subtype = 'number';
            }

            if (subtype === 'number' && isNaN(initDefault) && initDefault !== '') {
                utility.warn("MakeNumberForm - default value is not a number!", idName, initDefault);
            }

            if (!initDefault) {
                initDefault = '';
            }

            if (config.getItem(idName, 'defaultValue') === 'defaultValue') {
                config.setItem(idName, initDefault);
            }

            if (!formatParms) {
                formatParms = "size='4'";
            }

            return ("<input type='text' data-subtype='" + subtype + "' id='caap_" + idName + "' " + formatParms + " title=" + '"' + instructions + '" ' + "value='" + config.getItem(idName) + "' />");
        } catch (err) {
            utility.error("ERROR in MakeNumberForm: " + err);
            return '';
        }
    },

    MakeCheckTR: function (text, idName, defaultValue, varClass, instructions, tableTF) {
        try {
            var htmlCode = "<tr><td style='width: 90%'>" + text +
                "</td><td style='width: 10%; text-align: right'>" +
                this.MakeCheckBox(idName, defaultValue, varClass, instructions, tableTF);

            if (!tableTF) {
                htmlCode += "</td></tr>";
            }

            return htmlCode;
        } catch (err) {
            utility.error("ERROR in MakeCheckTR: " + err);
            return '';
        }
    },

    AddCollapsingDiv: function (parentId, subId) {
        try {
            return ("<div id='caap_" + subId + "' style='display: " + (config.getItem(parentId, false) ? 'block' : 'none') + "'>");
        } catch (err) {
            utility.error("ERROR in AddCollapsingDiv: " + err);
            return '';
        }
    },

    ToggleControl: function (controlId, staticText) {
        try {
            var currentDisplay = state.getItem('Control_' + controlId, "none"),
                displayChar    = "-",
                toggleCode     = '';

            if (currentDisplay === "none") {
                displayChar = "+";
            }

            toggleCode = '<a style="font-weight: bold;" id="caap_Switch_' + controlId +
                '" href="javascript:;" style="text-decoration: none;"> ' +
                displayChar + ' ' + staticText + '</a><br />' +
                "<div id='caap_" + controlId + "' style='display: " + currentDisplay + "'>";

            return toggleCode;
        } catch (err) {
            utility.error("ERROR in ToggleControl: " + err);
            return '';
        }
    },

    MakeTextBox: function (idName, instructions, initDefault, formatParms) {
        try {
            if (!initDefault) {
                initDefault = '';
            }

            if (config.getItem(idName, 'defaultValue') === 'defaultValue') {
                config.setItem(idName, initDefault);
            }

            if (formatParms === '') {
                if (utility.is_chrome) {
                    formatParms = " rows='3' cols='25'";
                } else {
                    formatParms = " rows='3' cols='21'";
                }
            }

            return ("<textarea title=" + '"' + instructions + '"' + " type='text' id='caap_" + idName + "' " + formatParms + ">" + config.getItem(idName) + "</textarea>");
        } catch (err) {
            utility.error("ERROR in MakeTextBox: " + err);
            return '';
        }
    },

    SaveBoxText: function (idName) {
        try {
            var boxText = this.caapDivObject.find("#caap_" + idName).val();
            if (typeof boxText !== 'string') {
                throw "Value of the textarea id='caap_" + idName + "' is not a string: " + boxText;
            }

            config.setItem(idName, boxText);
            return true;
        } catch (err) {
            utility.error("ERROR in SaveBoxText: " + err);
            return false;
        }
    },

    SetDivContent: function (idName, mess) {
        try {
            if (config.getItem('SetTitle', false) && config.getItem('SetTitleAction', false) && idName === "activity_mess") {
                var DocumentTitle = mess.replace("Activity: ", '') + " - ";

                if (config.getItem('SetTitleName', false)) {
                    DocumentTitle += this.stats.PlayerName + " - ";
                }

                document.title = DocumentTitle + this.documentTitle;
            }

            this.caapDivObject.find('#caap_' + idName).html(mess);
        } catch (err) {
            utility.error("ERROR in SetDivContent: " + err);
        }
    },

    landQuestList: [
        'Land of Fire',
        'Land of Earth',
        'Land of Mist',
        'Land of Water',
        'Demon Realm',
        'Undead Realm',
        'Underworld',
        'Kingdom of Heaven',
        'Ivory City',
        'Earth II'
    ],

    demiQuestList: [
        'Ambrosia',
        'Malekus',
        'Corvintheus',
        'Aurora',
        'Azeron'
    ],

    atlantisQuestList: [
        'Atlantis'
    ],

    SelectDropOption: function (idName, value) {
        try {
            this.caapDivObject.find("#caap_" + idName + " option").removeAttr('selected');
            this.caapDivObject.find("#caap_" + idName + " option[value='" + value + "']").attr('selected', 'selected');
            return true;
        } catch (err) {
            utility.error("ERROR in SelectDropOption: " + err);
            return false;
        }
    },

    autoQuest: function () {
        this.data = {
            name: '',
            energy: 0,
            general: 'none',
            expRatio: 0
        };
    },

    newAutoQuest: function () {
        return (new this.autoQuest()).data;
    },

    updateAutoQuest: function (id, value) {
        try {
            var temp = state.getItem('AutoQuest', this.newAutoQuest());

            if (typeof id !== 'string' || id === '') {
                throw "No valid id supplied!";
            }

            if (value === undefined || value === null) {
                throw "No value supplied!";
            }

            temp[id] = value;
            state.setItem('AutoQuest', temp);
            return true;
        } catch (err) {
            utility.error("ERROR in updateAutoQuest: " + err);
            return false;
        }
    },

    ShowAutoQuest: function () {
        try {
            this.caapDivObject.find("#stopAutoQuest").text("Stop auto quest: " + state.getItem('AutoQuest', this.newAutoQuest()).name + " (energy: " + state.getItem('AutoQuest', this.newAutoQuest()).energy + ")");
            this.caapDivObject.find("#stopAutoQuest").css('display', 'block');
            return true;
        } catch (err) {
            utility.error("ERROR in ShowAutoQuest: " + err);
            return false;
        }
    },

    ClearAutoQuest: function () {
        try {
            this.caapDivObject.find("#stopAutoQuest").text("");
            this.caapDivObject.find("#stopAutoQuest").css('display', 'none');
            return true;
        } catch (err) {
            utility.error("ERROR in ClearAutoQuest: " + err);
            return false;
        }
    },

    ManualAutoQuest: function (AutoQuest) {
        try {
            if (!AutoQuest) {
                AutoQuest = this.newAutoQuest();
            }

            state.setItem('AutoQuest', AutoQuest);
            config.setItem('WhyQuest', 'Manual');
            this.SelectDropOption('WhyQuest', 'Manual');
            this.ClearAutoQuest();
            utility.log(5, "ManualAutoQuest", state.getItem('AutoQuest'));
            return true;
        } catch (err) {
            utility.error("ERROR in ManualAutoQuest: " + err);
            return false;
        }
    },

    ChangeDropDownList: function (idName, dropList, option) {
        try {
            this.caapDivObject.find("#caap_" + idName + " option").remove();
            this.caapDivObject.find("#caap_" + idName).append(this.defaultDropDownOption);
            for (var item = 0; item < dropList.length; item += 1) {
                if (item === 0 && !option) {
                    config.setItem(idName, dropList[item]);
                    utility.log(1, "Saved: " + idName + "  Value: " + dropList[item]);
                }

                this.caapDivObject.find("#caap_" + idName).append("<option value='" + dropList[item] + "'>" + dropList[item] + "</option>");
            }

            if (option) {
                this.caapDivObject.find("#caap_" + idName + " option[value='" + option + "']").attr('selected', 'selected');
            } else {
                this.caapDivObject.find("#caap_" + idName + " option:eq(1)").attr('selected', 'selected');
            }

            return true;
        } catch (err) {
            utility.error("ERROR in ChangeDropDownList: " + err);
            return false;
        }
    },

    controlXY: {
        selector : '.UIStandardFrame_Content',
        x        : 0,
        y        : 0
    },

    GetControlXY: function (reset) {
        try {
            var newTop  = 0,
                newLeft = 0;

            if (reset) {
                newTop = $(this.controlXY.selector).offset().top;
            } else {
                newTop = this.controlXY.y;
            }

            if (this.controlXY.x === '' || reset) {
                newLeft = $(this.controlXY.selector).offset().left + $(this.controlXY.selector).width() + 10;
            } else {
                newLeft = $(this.controlXY.selector).offset().left + this.controlXY.x;
            }

            return {x: newLeft, y: newTop};
        } catch (err) {
            utility.error("ERROR in GetControlXY: " + err);
            return {x: 0, y: 0};
        }
    },

    SaveControlXY: function () {
        try {
            var refOffset = $(this.controlXY.selector).offset();
            state.setItem('caap_div_menuTop', caap.caapDivObject.offset().top);
            state.setItem('caap_div_menuLeft', caap.caapDivObject.offset().left - refOffset.left);
            state.setItem('caap_top_zIndex', '1');
            state.setItem('caap_div_zIndex', '2');
        } catch (err) {
            utility.error("ERROR in SaveControlXY: " + err);
        }
    },

    dashboardXY: {
        selector : '#app46755028429_app_body_container',
        x        : 0,
        y        : 0
    },

    GetDashboardXY: function (reset) {
        try {
            var newTop  = 0,
                newLeft = 0;

            if (reset) {
                newTop = $(this.dashboardXY.selector).offset().top - 10;
            } else {
                newTop = this.dashboardXY.y;
            }

            if (this.dashboardXY.x === '' || reset) {
                newLeft = $(this.dashboardXY.selector).offset().left;
            } else {
                newLeft = $(this.dashboardXY.selector).offset().left + this.dashboardXY.x;
            }

            return {x: newLeft, y: newTop};
        } catch (err) {
            utility.error("ERROR in GetDashboardXY: " + err);
            return {x: 0, y: 0};
        }
    },

    SaveDashboardXY: function () {
        try {
            var refOffset = $(this.dashboardXY.selector).offset();
            state.setItem('caap_top_menuTop', this.caapTopObject.offset().top);
            state.setItem('caap_top_menuLeft', this.caapTopObject.offset().left - refOffset.left);
            state.setItem('caap_div_zIndex', '1');
            state.setItem('caap_top_zIndex', '2');
        } catch (err) {
            utility.error("ERROR in SaveDashboardXY: " + err);
        }
    },

    AddControl: function () {
        try {
            var caapDiv = "<div id='caap_div'>",
                divID = 0,
                styleXY = {
                    x: 0,
                    y: 0
                },
                htmlCode = '',
                banner = '',
                divList = [
                    'banner',
                    'activity_mess',
                    'idle_mess',
                    'quest_mess',
                    'battle_mess',
                    'monster_mess',
                    'guild_monster_mess',
                    'fortify_mess',
                    'heal_mess',
                    'demipoint_mess',
                    'demibless_mess',
                    'level_mess',
                    'exp_mess',
                    'debug1_mess',
                    'debug2_mess',
                    'control'
                ];

            for (divID = 0; divID < divList.length; divID += 1) {
                caapDiv += "<div id='caap_" + divList[divID] + "'></div>";
            }

            caapDiv += "</div>";
            this.controlXY.x = state.getItem('caap_div_menuLeft', '');
            this.controlXY.y = state.getItem('caap_div_menuTop', $(this.controlXY.selector).offset().top);
            styleXY = this.GetControlXY();
            $(caapDiv).css({
                width                   : '180px',
                background              : config.getItem('StyleBackgroundLight', '#E0C691'),
                opacity                 : config.getItem('StyleOpacityLight', 1),
                color                   : '#000',
                padding                 : "4px",
                border                  : "2px solid #444",
                top                     : styleXY.y + 'px',
                left                    : styleXY.x + 'px',
                zIndex                  : state.getItem('caap_div_zIndex', '2'),
                position                : 'absolute',
                '-moz-border-radius'    : '5px',
                '-webkit-border-radius' : '5px'
            }).appendTo(document.body);

            this.caapDivObject = $("#caap_div");

            banner += "<div id='caap_BannerHide' style='display: " + (config.getItem('BannerDisplay', true) ? 'block' : 'none') + "'>";
            banner += "<img src='data:image/png;base64," + image64.header + "' alt='Castle Age Auto Player' /><br /><hr /></div>";
            this.SetDivContent('banner', banner);

            htmlCode += this.AddPauseMenu();
            htmlCode += this.AddDisableMenu();
            htmlCode += this.AddCashHealthMenu();
            htmlCode += this.AddQuestMenu();
            htmlCode += this.AddBattleMenu();
            htmlCode += this.AddMonsterMenu();
            htmlCode += this.AddGuildMonstersMenu();
            htmlCode += this.AddReconMenu();
            htmlCode += this.AddGeneralsMenu();
            htmlCode += this.AddSkillPointsMenu();
            htmlCode += this.AddEliteGuardOptionsMenu();
            htmlCode += this.AddGiftingOptionsMenu();
            htmlCode += this.AddAutoOptionsMenu();
            htmlCode += this.AddOtherOptionsMenu();
            htmlCode += this.AddFooterMenu();
            this.SetDivContent('control', htmlCode);

            this.CheckLastAction(state.getItem('LastAction', 'none'));
            $("#caap_resetElite").button();
            $("#caap_StartedColourSelect").button();
            $("#caap_StopedColourSelect").button();
            $("#caap_FillArmy").button();
            $("#caap_ResetMenuLocation").button();
            return true;
        } catch (err) {
            utility.error("ERROR in AddControl: " + err);
            return false;
        }
    },

    AddPauseMenu: function () {
        try {
            return ("<div id='caapPaused' style='font-weight: bold; display: " + state.getItem('caapPause', 'block') + "'>Paused on mouse click.<br /><a href='javascript:;' id='caapRestart' >Click here to restart</a></div><hr />");
        } catch (err) {
            utility.error("ERROR in AddPauseMenu: " + err);
            return ("<div id='caapPaused' style='font-weight: bold; display: block'>Paused on mouse click.<br /><a href='javascript:;' id='caapRestart' >Click here to restart</a></div><hr />");
        }
    },

    AddDisableMenu: function () {
        try {
            var autoRunInstructions = "Disable auto running of CAAP. Stays persistent even on page reload and the autoplayer will not autoplay.",
                htmlCode = '';

            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR("Disable Autoplayer", 'Disabled', false, '', autoRunInstructions) + '</table><hr />';
            return htmlCode;
        } catch (err) {
            utility.error("ERROR in AddDisableMenu: " + err);
            return '';
        }
    },

    AddCashHealthMenu: function () {
        try {
            var bankInstructions0 = "Minimum cash to keep in the bank. Press tab to save",
                bankInstructions1 = "Minimum cash to have on hand, press tab to save",
                bankInstructions2 = "Maximum cash to have on hand, bank anything above this, press tab to save (leave blank to disable).",
                healthInstructions = "Minimum health to have before healing, press tab to save (leave blank to disable).",
                healthStamInstructions = "Minimum Stamina to have before healing, press tab to save (leave blank to disable).",
                bankImmedInstructions = "Bank as soon as possible. May interrupt player and monster battles.",
                autobuyInstructions = "Automatically buy lands in groups of 10 based on best Return On Investment value.",
                autosellInstructions = "Automatically sell off any excess lands above your level allowance.",
                htmlCode = '';

            htmlCode += this.ToggleControl('CashandHealth', 'CASH and HEALTH');
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR("Bank Immediately", 'BankImmed', false, '', bankImmedInstructions);
            htmlCode += this.MakeCheckTR("Auto Buy Lands", 'autoBuyLand', false, '', autobuyInstructions);
            htmlCode += this.MakeCheckTR("Auto Sell Excess Lands", 'SellLands', false, '', autosellInstructions) + '</table>';
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td>Keep In Bank</td><td style='text-align: right'>$" + this.MakeNumberForm('minInStore', bankInstructions0, 100000, "size='12' style='font-size: 10px; text-align: right'") + "</td></tr></table>";
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td>Bank Above</td><td style='text-align: right'>$" + this.MakeNumberForm('MaxInCash', bankInstructions2, '', "size='7' style='font-size: 10px; text-align: right'") + "</td></tr>";
            htmlCode += "<tr><td style='padding-left: 10px'>But Keep On Hand</td><td style='text-align: right'>$" +
                this.MakeNumberForm('MinInCash', bankInstructions1, '', "size='7' style='font-size: 10px; text-align: right'") + "</td></tr></table>";
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td>Heal If Health Below</td><td style='text-align: right'>" + this.MakeNumberForm('MinToHeal', healthInstructions, '', "size='2' style='font-size: 10px; text-align: right'") + "</td></tr>";
            htmlCode += "<tr><td style='padding-left: 10px'>But Not If Stamina Below</td><td style='text-align: right'>" +
                this.MakeNumberForm('MinStamToHeal', healthStamInstructions, '', "size='2' style='font-size: 10px; text-align: right'") + '</td></tr></table>';
            htmlCode += "<hr/></div>";
            return htmlCode;
        } catch (err) {
            utility.error("ERROR in AddCashHealthMenu: " + err);
            return '';
        }
    },

    AddQuestMenu: function () {
        try {
            var forceSubGen = "Always do a quest with the Subquest General you selected under the Generals section. NOTE: This will keep the script from automatically switching to the required general for experience of primary quests.",
                XQuestInstructions = "Start questing when energy is at or above this value.",
                XMinQuestInstructions = "Stop quest when energy is at or below this value.",
                questForList = [
                    'Advancement',
                    'Max Influence',
                    'Max Gold',
                    'Max Experience',
                    'Manual'
                ],
                questForListInstructions = [
                    'Advancement performs all the main quests in a sub quest area but not the secondary quests.',
                    'Max Influence performs all the main and secondary quests in a sub quest area.',
                    'Max Gold performs the quest in the specific area that yields the highest gold.',
                    'Max Experience performs the quest in the specific area that yields the highest experience.',
                    'Manual performs the specific quest that you have chosen.'
                ],
                questAreaList = [
                    'Quest',
                    'Demi Quests',
                    'Atlantis'
                ],
                questWhenList = [
                    'Energy Available',
                    'At Max Energy',
                    'At X Energy',
                    'Not Fortifying',
                    'Never'
                ],
                questWhenInst = [
                    'Energy Available - will quest whenever you have enough energy.',
                    'At Max Energy - will quest when energy is at max and will burn down all energy when able to level up.',
                    'At X Energy - allows you to set maximum and minimum energy values to start and stop questing. Will burn down all energy when able to level up.',
                    'Not Fortifying - will quest only when your fortify settings are matched.',
                    'Never - disables questing.'
                ],
                stopInstructions = "This will stop and remove the chosen quest and set questing to manual.",
                autoQuestName = state.getItem('AutoQuest', this.newAutoQuest()).name,
                htmlCode = '';

            htmlCode += this.ToggleControl('Quests', 'QUEST');
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td width=80>Quest When</td><td style='text-align: right; width: 60%'>" + this.MakeDropDown('WhenQuest', questWhenList, questWhenInst, "style='font-size: 10px; width: 100%'", 'Never') + '</td></tr></table>';
            htmlCode += "<div id='caap_WhenQuestHide' style='display: " + (config.getItem('WhenQuest', 'Never') !== 'Never' ? 'block' : 'none') + "'>";
            htmlCode += "<div id='caap_WhenQuestXEnergy' style='display: " + (config.getItem('WhenQuest', 'Never') !== 'At X Energy' ? 'none' : 'block') + "'>";
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td>Start At Or Above Energy</td><td style='text-align: right'>" + this.MakeNumberForm('XQuestEnergy', XQuestInstructions, 1, "size='3' style='font-size: 10px; text-align: right'") + '</td></tr>';
            htmlCode += "<tr><td style='padding-left: 10px'>Stop At Or Below Energy</td><td style='text-align: right'>" +
                this.MakeNumberForm('XMinQuestEnergy', XMinQuestInstructions, 0, "size='3' style='font-size: 10px; text-align: right'") + '</td></tr></table>';
            htmlCode += "</div>";
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td>Quest Area</td><td style='text-align: right; width: 60%'>" + this.MakeDropDown('QuestArea', questAreaList, '', "style='font-size: 10px; width: 100%'") + '</td></tr>';
            htmlCode += "<tr id='trQuestSubArea' style='display: table-row'><td>&nbsp;&nbsp;&nbsp;Sub Area</td><td style='text-align: right; width: 60%'>";
            switch (config.getItem('QuestArea', questAreaList[0])) {
            case 'Quest' :
                htmlCode += this.MakeDropDown('QuestSubArea', this.landQuestList, '', "style='font-size: 10px; width: 100%'");
                break;
            case 'Demi Quests' :
                htmlCode += this.MakeDropDown('QuestSubArea', this.demiQuestList, '', "style='font-size: 10px; width: 100%'");
                break;
            default :
                htmlCode += this.MakeDropDown('QuestSubArea', this.atlantisQuestList, '', "style='font-size: 10px; width: 100%'");
                break;
            }

            htmlCode += '</td></tr>';
            htmlCode += "<tr><td>Quest For</td><td style='text-align: right; width: 60%'>" + this.MakeDropDown('WhyQuest', questForList, questForListInstructions, "style='font-size: 10px; width: 100%'") + '</td></tr></table>';
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR("Switch Quest Area", 'switchQuestArea', true, '', 'Allows switching quest area after Advancement or Max Influence');
            htmlCode += this.MakeCheckTR("Use Only Subquest General", 'ForceSubGeneral', false, '', forceSubGen);
            htmlCode += this.MakeCheckTR("Quest For Orbs", 'GetOrbs', false, '', 'Perform the Boss quest in the selected land for orbs you do not have.') + "</table>";
            htmlCode += "</div>";
            if (autoQuestName) {
                htmlCode += "<a id='stopAutoQuest' style='display: block' href='javascript:;' title='" + stopInstructions + "'>Stop auto quest: " + autoQuestName + " (energy: " + state.getItem('AutoQuest', this.newAutoQuest()).energy + ")" + "</a>";
            } else {
                htmlCode += "<a id='stopAutoQuest' style='display: none' href='javascript:;' title='" + stopInstructions + "'></a>";
            }

            htmlCode += "<hr/></div>";
            return htmlCode;
        } catch (err) {
            utility.error("ERROR in AddQuestMenu: " + err);
            return '';
        }
    },

    AddBattleMenu: function () {
        try {
            var XBattleInstructions = "Start battling if stamina is above this points",
                XMinBattleInstructions = "Don't battle if stamina is below this points",
                safeHealthInstructions = "Wait until health is 13 instead of 10, prevents you killing yourself but leaves you unhidden for upto 15 minutes",
                userIdInstructions = "User IDs(not user name).  Click with the " +
                    "right mouse button on the link to the users profile & copy link." +
                    "  Then paste it here and remove everything but the last numbers." +
                    " (ie. 123456789)",
                chainBPInstructions = "Number of battle points won to initiate a chain attack. Specify 0 to always chain attack.",
                chainGoldInstructions = "Amount of gold won to initiate a chain attack. Specify 0 to always chain attack.",
                maxChainsInstructions = "Maximum number of chain hits after the initial attack.",
                FMRankInstructions = "The lowest relative rank below yours that " +
                    "you are willing to spend your stamina on. Leave blank to attack " +
                    "any rank.",
                FMARBaseInstructions = "This value sets the base for your army " +
                    "ratio calculation. It is basically a multiplier for the army " +
                    "size of a player at your equal level. A value of 1 means you " +
                    "will battle an opponent the same level as you with an army the " +
                    "same size as you or less. Default .5",
                plusonekillsInstructions = "Force +1 kill scenario if 80% or more" +
                    " of targets are withn freshmeat settings. Note: Since Castle Age" +
                    " choses the target, selecting this option could result in a " +
                    "greater chance of loss.",
                raidOrderInstructions = "List of search words that decide which " +
                    "raids to participate in first.  Use words in player name or in " +
                    "raid name. To specify max damage follow keyword with :max token " +
                    "and specifiy max damage values. Use 'k' and 'm' suffixes for " +
                    "thousand and million.",
                ignorebattlelossInstructions = "Ignore battle losses and attack " +
                    "regardless.  This will also delete all battle loss records.",
                battleList = [
                    'Stamina Available',
                    'At Max Stamina',
                    'At X Stamina',
                    'No Monster',
                    'Stay Hidden',
                    'Demi Points Only',
                    'Never'
                ],
                battleInst = [
                    'Stamina Available will battle whenever you have enough stamina',
                    'At Max Stamina will battle when stamina is at max and will burn down all stamina when able to level up',
                    'At X Stamina you can set maximum and minimum stamina to battle',
                    'No Monster will battle only when there are no active monster battles or if Get Demi Points First has been selected.',
                    'Stay Hidden uses stamina to try to keep you under 10 health so you cannot be attacked, while also attempting to maximize your stamina use for Monster attacks. YOU MUST SET MONSTER TO "STAY HIDDEN" TO USE THIS FEATURE.',
                    'Demi Points Only will battle only when Daily Demi Points are required, can use in conjunction with Get Demi Points First.',
                    'Never - disables player battles'
                ],
                typeList = [
                    'Invade',
                    'Duel',
                    'War'
                ],
                typeInst = [
                    'Battle using Invade button',
                    'Battle using Duel button - no guarentee you will win though',
                    'War using Duel button - no guarentee you will win though'
                ],
                targetList = [
                    'Freshmeat',
                    'Userid List',
                    'Raid'
                ],
                targetInst = [
                    'Use settings to select a target from the Battle Page',
                    'Select target from the supplied list of userids',
                    'Raid Battles'
                ],
                dosiegeInstructions = "(EXPERIMENTAL) Turns on or off automatic siege assist for all raids only.",
                collectRewardInstructions = "(EXPERIMENTAL) Automatically collect raid rewards.",
                observeDemiFirstInstructions = "If you are setting Get demi Points First and No Attack If % Under in Monster then enabling this option " +
                    "will cause Demi Points Only to observe the Demi Points requested in the case where No Attack If % Under is triggered.",
                htmlCode = '';

            htmlCode += this.ToggleControl('Battling', 'BATTLE');
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td>Battle When</td><td style='text-align: right; width: 65%'>" + this.MakeDropDown('WhenBattle', battleList, battleInst, "style='font-size: 10px; width: 100%'", 'Never') + '</td></tr></table>';
            htmlCode += "<div id='caap_WhenBattleStayHidden1' style='color: red; font-weight: bold; display: " +
                (config.getItem('WhenBattle', 'Never') === 'Stay Hidden' && config.getItem('WhenMonster', 'Never') !== 'Stay Hidden' ? 'block' : 'none') + "'>Warning: Monster Not Set To 'Stay Hidden'";
            htmlCode += "</div>";
            htmlCode += "<div id='caap_WhenBattleXStamina' style='display: " + (config.getItem('WhenBattle', 'Never') !== 'At X Stamina' ? 'none' : 'block') + "'>";
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td>Start Battles When Stamina</td><td style='text-align: right'>" + this.MakeNumberForm('XBattleStamina', XBattleInstructions, 1, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr>';
            htmlCode += "<tr><td style='padding-left: 10px'>Keep This Stamina</td><td style='text-align: right'>" +
                this.MakeNumberForm('XMinBattleStamina', XMinBattleInstructions, 0, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr></table>';
            htmlCode += "</div>";
            htmlCode += "<div id='caap_WhenBattleDemiOnly' style='display: " + (config.getItem('WhenBattle', 'Never') !== 'Demi Points Only' ? 'none' : 'block') + "'>";
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR("Observe Get Demi Points First", 'observeDemiFirst', false, '', observeDemiFirstInstructions) + '</table>';
            htmlCode += "</div>";
            htmlCode += "<div id='caap_WhenBattleHide' style='display: " + (config.getItem('WhenBattle', 'Never') !== 'Never' ? 'block' : 'none') + "'>";
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td>Battle Type</td><td style='text-align: right; width: 40%'>" + this.MakeDropDown('BattleType', typeList, typeInst, "style='font-size: 10px; width: 100%'") + '</td></tr></table>';
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR("Wait For Safe Health", 'waitSafeHealth', false, '', safeHealthInstructions);
            htmlCode += this.MakeCheckTR("Siege Weapon Assist Raids", 'raidDoSiege', true, '', dosiegeInstructions);
            htmlCode += this.MakeCheckTR("Collect Raid Rewards", 'raidCollectReward', false, '', collectRewardInstructions);
            htmlCode += this.MakeCheckTR("Clear Complete Raids", 'clearCompleteRaids', false, '', '');
            htmlCode += this.MakeCheckTR("Ignore Battle Losses", 'IgnoreBattleLoss', false, '', ignorebattlelossInstructions);
            htmlCode += "<tr><td>Chain:Battle Points Won</td><td style='text-align: right'>" + this.MakeNumberForm('ChainBP', chainBPInstructions, '', "size='2' style='font-size: 10px; text-align: right'") + '</td></tr>';
            htmlCode += "<tr><td>Chain:Gold Won</td><td style='text-align: right'>" + this.MakeNumberForm('ChainGold', chainGoldInstructions, '', "size='5' style='font-size: 10px; text-align: right'") + '</td></tr>';
            htmlCode += "<tr><td>Max Chains</td><td style='text-align: right'>" + this.MakeNumberForm('MaxChains', maxChainsInstructions, 4, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr></table>';
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td>Target Type</td><td style='text-align: right; width: 50%'>" + this.MakeDropDown('TargetType', targetList, targetInst, "style='font-size: 10px; width: 100%'") + '</td></tr></table>';
            htmlCode += "<div id='caap_FreshmeatSub' style='display: " + (config.getItem('TargetType', 'Never') !== 'Userid List' ? 'block' : 'none') + "'>";
            htmlCode += "Attack targets that are:";
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td style='padding-left: 10px'>Not Lower Than Rank Minus</td><td style='text-align: right'>" +
                this.MakeNumberForm('FreshMeatMinRank', FMRankInstructions, '', "size='2' style='font-size: 10px; text-align: right'") + '</td></tr>';
            htmlCode += "<tr><td style='padding-left: 10px'>Not Higher Than X*Army</td><td style='text-align: right'>" +
                this.MakeNumberForm('FreshMeatARBase', FMARBaseInstructions, 0.5, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr></table>';
            htmlCode += "</div>";
            htmlCode += "<div id='caap_RaidSub' style='display: " + (config.getItem('TargetType', 'Invade') === 'Raid' ? 'block' : 'none') + "'>";
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR("Attempt +1 Kills", 'PlusOneKills', false, '', plusonekillsInstructions) + '</table>';
            htmlCode += "Join Raids in this order <a href='http://senses.ws/caap/index.php?topic=1502.0' target='_blank' style='color: blue'>(INFO)</a><br />";
            htmlCode += this.MakeTextBox('orderraid', raidOrderInstructions, '', '');
            htmlCode += "</div>";
            htmlCode += "<div align=right id='caap_UserIdsSub' style='display: " + (config.getItem('TargetType', 'Invade') === 'Userid List' ? 'block' : 'none') + "'>";
            htmlCode += this.MakeTextBox('BattleTargets', userIdInstructions, '', '');
            htmlCode += "</div>";
            htmlCode += "</div>";
            htmlCode += "<hr/></div>";
            return htmlCode;
        } catch (err) {
            utility.error("ERROR in AddBattleMenu: " + err);
            return '';
        }
    },

    AddMonsterMenu: function () {
        try {
            var XMonsterInstructions = "Start attacking if stamina is above this points",
                XMinMonsterInstructions = "Don't attack if stamina is below this points",
                attackOrderInstructions = "List of search words that decide which monster to attack first. " +
                    "Use words in player name or in monster name. To specify max damage follow keyword with " +
                    ":max token and specifiy max damage values. Use 'k' and 'm' suffixes for thousand and million. " +
                    "To override achievement use the ach: token and specify damage values.",
                fortifyInstructions = "Fortify if ship health is below this % (leave blank to disable)",
                questFortifyInstructions = "Do Quests if ship health is above this % and quest mode is set to Not Fortify (leave blank to disable)",
                stopAttackInstructions = "Don't attack if ship health is below this % (leave blank to disable)",
                monsterachieveInstructions = "Check if monsters have reached achievement damage level first. Switch when achievement met.",
                demiPointsFirstInstructions = "Don't attack monsters until you've gotten all your demi points from battling. Set 'Battle When' to 'No Monster'",
                powerattackInstructions = "Use power attacks. Only do normal attacks if power attack not possible",
                powerattackMaxInstructions = "Use maximum power attacks globally on Skaar, Genesis, Ragnarok, and Bahamut types. Only do normal power attacks if maximum power attack not possible",
                powerfortifyMaxInstructions = "Use maximum power fortify globally. Only do normal fortify attacks if maximum power fortify not possible. " +
                    "Also includes other energy attacks, Strengthen, Deflect and Cripple. NOTE: Setting a high forty% can waste energy and no safety on other types.",
                dosiegeInstructions = "Turns on or off automatic siege assist for all monsters only.",
                useTacticsInstructions = "Use the Tactics attack method, on monsters that support it, instead of the normal attack. You must be level 50 or above.",
                useTacticsThresholdInstructions = "If monster health falls below this percentage then use the regular attack buttons instead of tactics.",
                collectRewardInstructions = "Automatically collect monster rewards.",
                strengthenTo100Instructions = "Don't wait until the character class gets a bonus for strengthening but perform strengthening as soon as the energy is available.",
                mbattleList = [
                    'Stamina Available',
                    'At Max Stamina',
                    'At X Stamina',
                    'Stay Hidden',
                    'Never'
                ],
                mbattleInst = [
                    'Stamina Available will attack whenever you have enough stamina',
                    'At Max Stamina will attack when stamina is at max and will burn down all stamina when able to level up',
                    'At X Stamina you can set maximum and minimum stamina to battle',
                    'Stay Hidden uses stamina to try to keep you under 10 health so you cannot be attacked, while also attempting to maximize your stamina use for Monster attacks. YOU MUST SET BATTLE WHEN TO "STAY HIDDEN" TO USE THIS FEATURE.',
                    'Never - disables attacking monsters'
                ],
                monsterDelayInstructions = "Max random delay (in seconds) to battle monsters",
                demiPoint = [
                    'Ambrosia',
                    'Malekus',
                    'Corvintheus',
                    'Aurora',
                    'Azeron'
                ],
                demiPtItem = 0,
                htmlCode = '';

            htmlCode += this.ToggleControl('Monster', 'MONSTER');
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td style='width: 35%'>Attack When</td><td style='text-align: right'>" + this.MakeDropDown('WhenMonster', mbattleList, mbattleInst, "style='font-size: 10px; width: 100%;'", 'Never') + '</td></tr></table>';
            htmlCode += "<div id='caap_WhenMonsterStayHidden1' style='color: red; font-weight: bold; display: " +
                (config.getItem('WhenMonster', 'Never') === 'Stay Hidden' && config.getItem('WhenBattle', 'Never') !== 'Stay Hidden' ? 'block' : 'none') + "'>Warning: Battle Not Set To 'Stay Hidden'";
            htmlCode += "</div>";
            htmlCode += "<div id='caap_WhenMonsterXStamina' style='display: " + (config.getItem('WhenMonster', 'Never') !== 'At X Stamina' ? 'none' : 'block') + "'>";
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td>Battle When Stamina</td><td style='text-align: right'>" + this.MakeNumberForm('XMonsterStamina', XMonsterInstructions, 1, "size='3' style='font-size: 10px; text-align: right'") + '</td></tr>';
            htmlCode += "<tr><td style='padding-left: 10px'>Keep This Stamina</td><td style='text-align: right'>" +
                this.MakeNumberForm('XMinMonsterStamina', XMinMonsterInstructions, 0, "size='3' style='font-size: 10px; text-align: right'") + '</td></tr></table>';
            htmlCode += "</div>";
            htmlCode += "<div id='caap_WhenMonsterHide' style='display: " + (config.getItem('WhenMonster', 'Never') !== 'Never' ? 'block' : 'none') + "'>";
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td>Monster delay secs</td><td style='text-align: right'>" + this.MakeNumberForm('seedTime', monsterDelayInstructions, 300, "size='3' style='font-size: 10px; text-align: right'") + "</td></tr>";
            htmlCode += this.MakeCheckTR("Use Tactics", 'UseTactics', false, 'UseTactics_Adv', useTacticsInstructions, true);
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td>&nbsp;&nbsp;&nbsp;Health threshold</td><td style='text-align: right'>" +
                this.MakeNumberForm('TacticsThreshold', useTacticsThresholdInstructions, 75, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr></table>';
            htmlCode += "</div>";

            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR("Power Attack Only", 'PowerAttack', true, 'PowerAttack_Adv', powerattackInstructions, true);
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR("&nbsp;&nbsp;&nbsp;Power Attack Max", 'PowerAttackMax', false, '', powerattackMaxInstructions) + "</table>";
            htmlCode += "</div>";
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR("Power Fortify Max", 'PowerFortifyMax', false, '', powerfortifyMaxInstructions);
            htmlCode += this.MakeCheckTR("Siege Weapon Assist Monsters", 'monsterDoSiege', true, '', dosiegeInstructions);
            htmlCode += this.MakeCheckTR("Collect Monster Rewards", 'monsterCollectReward', false, '', collectRewardInstructions);
            htmlCode += this.MakeCheckTR("Clear Complete Monsters", 'clearCompleteMonsters', false, '', '');
            htmlCode += this.MakeCheckTR("Achievement Mode", 'AchievementMode', true, '', monsterachieveInstructions);
            htmlCode += this.MakeCheckTR("Get Demi Points First", 'DemiPointsFirst', false, 'DemiList', demiPointsFirstInstructions, true);
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<span style='white-space: nowrap;'>";
            for (demiPtItem = 0; demiPtItem < demiPoint.length; demiPtItem += 1) {
                htmlCode += "<span title='" + demiPoint[demiPtItem] + "'><img alt='" + demiPoint[demiPtItem] + "' src='data:image/jpg;base64," + image64[demiPoint[demiPtItem]] + "' height='15px' width='15px'/>" +
                    this.MakeCheckBox('DemiPoint' + demiPtItem, true, '', '') + "</span>";
            }

            htmlCode += "</span>";
            htmlCode += "</table>";
            htmlCode += "</div>";
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td>Fortify If % Under</td><td style='text-align: right'>" +
                this.MakeNumberForm('MaxToFortify', fortifyInstructions, 50, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr>';
            htmlCode += "<tr><td style='padding-left: 10px'>Quest If % Over</td><td style='text-align: right'>" +
                this.MakeNumberForm('MaxHealthtoQuest', questFortifyInstructions, 60, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr>';
            htmlCode += "<tr><td>No Attack If % Under</td><td style='text-align: right'>" + this.MakeNumberForm('MinFortToAttack', stopAttackInstructions, 10, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr></table>';
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR("Don't Wait Until Strengthen", 'StrengthenTo100', true, '', strengthenTo100Instructions) + '</table>';
            htmlCode += "Attack Monsters in this order <a href='http://senses.ws/caap/index.php?topic=1502.0' target='_blank' style='color: blue'>(INFO)</a><br />";
            htmlCode += this.MakeTextBox('orderbattle_monster', attackOrderInstructions, '', '');
            htmlCode += "</div>";
            htmlCode += "<hr/></div>";
            return htmlCode;
        } catch (err) {
            utility.error("ERROR in AddMonsterMenu: " + err);
            return '';
        }
    },

    AddGuildMonstersMenu: function () {
        try {
            // Guild Monster controls
            var mbattleList = [
                    'Stamina Available',
                    'At Max Stamina',
                    'At X Stamina',
                    'Never'
                ],
                mbattleInst = [
                    'Stamina Available will attack whenever you have enough stamina',
                    'At Max Stamina will attack when stamina is at max and will burn down all stamina when able to level up',
                    'At X Stamina you can set maximum and minimum stamina to battle',
                    'Never - disables attacking monsters'
                ],
                htmlCode = '';

            htmlCode += this.ToggleControl('GuildMonsters', 'GUILD MONSTERS');
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td style='width: 35%'>Attack When</td><td style='text-align: right'>" + this.MakeDropDown('WhenGuildMonster', mbattleList, mbattleInst, "style='font-size: 10px; width: 100%;'", 'Never') + '</td></tr></table>';
            htmlCode += "<div id='caap_WhenGuildMonsterHide' style='display: " + (config.getItem('WhenGuildMonster', 'Never') !== 'Never' ? 'block' : 'none') + "'>";

            htmlCode += "<div id='caap_WhenGuildMonsterXStamina' style='display: " + (config.getItem('WhenGuildMonster', 'Never') !== 'At X Stamina' ? 'none' : 'block') + "'>";
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td style='padding-left: 0px'>Max Stamina To Fight</td><td style='text-align: right'>" +
                this.MakeNumberForm('MaxStaminaToGMonster', '', 20, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr>';
            htmlCode += "<tr><td style='padding-left: 10px'>Keep Stamina</td><td style='text-align: right'>" +
                this.MakeNumberForm('MinStaminaToGMonster', '', 0, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr></table>';
            htmlCode += "</div>";

            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR('Classic Monsters First', 'doClassicMonstersFirst', false, '', '');
            htmlCode += this.MakeCheckTR('Siege Monster', 'doGuildMonsterSiege', true, '', '');
            htmlCode += this.MakeCheckTR('Collect Rewards', 'guildMonsterCollect', false, '', '') + '</table>';
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td style='padding-left: 0px'>Ignore Minions Below Health</td><td style='text-align: right'>" +
                this.MakeNumberForm('IgnoreMinionsBelow', '', 0, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr></table>';
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR('&nbsp;&nbsp;&nbsp;Choose First Alive', 'chooseIgnoredMinions', false, '', '') + '</table>';
            htmlCode += "Attack Monsters in this order<br />";
            htmlCode += this.MakeTextBox('orderGuildMonster', '', '', '');

            htmlCode += "</div>";
            htmlCode += "<hr/></div>";
            return htmlCode;
        } catch (err) {
            utility.error("ERROR in AddGuildMonstersMenu: " + err);
            return '';
        }
    },

    AddReconMenu: function () {
        try {
            // Recon Controls
            var PReconInstructions = "Enable player battle reconnaissance to run " +
                    "as an idle background task. Battle targets will be collected and" +
                    " can be displayed using the 'Target List' selection on the " +
                    "dashboard.",
                PRRankInstructions = "Provide the number of ranks below you which" +
                    " recon will use to filter targets. This value will be subtracted" +
                    " from your rank to establish the minimum rank that recon will " +
                    "consider as a viable target. Default 3.",
                PRLevelInstructions = "Provide the number of levels above you " +
                    "which recon will use to filter targets. This value will be added" +
                    " to your level to establish the maximum level that recon will " +
                    "consider as a viable target. Default 10.",
                PRARBaseInstructions = "This value sets the base for your army " +
                    "ratio calculation. It is basically a multiplier for the army " +
                    "size of a player at your equal level. For example, a value of " +
                    ".5 means you will battle an opponent the same level as you with " +
                    "an army half the size of your army or less. Default 1.",
                htmlCode = '';

            htmlCode += this.ToggleControl('Recon', 'RECON');
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR("Enable Player Recon", 'DoPlayerRecon', false, 'PlayerReconControl', PReconInstructions, true);
            htmlCode += 'Find battle targets that are:';
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td style='padding-left: 10px'>Not Lower Than Rank Minus</td><td style='text-align: right'>" +
                this.MakeNumberForm('ReconPlayerRank', PRRankInstructions, 3, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr>';
            htmlCode += "<tr><td style='padding-left: 10px'>Not Higher Than Level Plus</td><td style='text-align: right'>" +
                this.MakeNumberForm('ReconPlayerLevel', PRLevelInstructions, 10, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr>';
            htmlCode += "<tr><td style='padding-left: 10px'>Not Higher Than X*Army</td><td style='text-align: right'>" +
                this.MakeNumberForm('ReconPlayerARBase', PRARBaseInstructions, 1, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr></table>';
            htmlCode += "</div>";
            htmlCode += "<hr/></div>";
            return htmlCode;
        } catch (err) {
            utility.error("ERROR in AddReconMenu: " + err);
            return '';
        }
    },

    AddGeneralsMenu: function () {
        try {
            // Add General Comboboxes
            var reverseGenInstructions = "This will make the script level Generals under level 4 from Top-down instead of Bottom-up",
                ignoreGeneralImage = "This will prevent the script " +
                    "from changing your selected General to 'Use Current' if the script " +
                    "is unable to find the General's image when changing activities. " +
                    "Instead it will use the current General for the activity and try " +
                    "to select the correct General again next time.",
                LevelUpGenExpInstructions = "Specify the number of experience " +
                    "points below the next level up to begin using the level up general.",
                LevelUpGenInstructions1 = "Use the Level Up General for Idle mode.",
                LevelUpGenInstructions2 = "Use the Level Up General for Monster mode.",
                LevelUpGenInstructions3 = "Use the Level Up General for Fortify mode.",
                LevelUpGenInstructions4 = "Use the Level Up General for Invade mode.",
                LevelUpGenInstructions5 = "Use the Level Up General for Duel mode.",
                LevelUpGenInstructions6 = "Use the Level Up General for War mode.",
                LevelUpGenInstructions7 = "Use the Level Up General for doing sub-quests.",
                LevelUpGenInstructions8 = "Use the Level Up General for doing primary quests " +
                    "(Warning: May cause you not to gain influence if wrong general is equipped.)",
                LevelUpGenInstructions9 = "Ignore Banking until level up energy and stamina gains have been used.",
                LevelUpGenInstructions10 = "Ignore Income until level up energy and stamina gains have been used.",
                LevelUpGenInstructions11 = "EXPERIMENTAL: Enables the Quest 'Not Fortifying' mode after level up.",
                LevelUpGenInstructions12 = "Use the Level Up General for Guild Monster mode.",
                dropDownItem = 0,
                htmlCode = '';

            htmlCode += this.ToggleControl('Generals', 'GENERALS');
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR("Do not reset General", 'ignoreGeneralImage', true, '', ignoreGeneralImage) + "</table>";
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            for (dropDownItem = 0; dropDownItem < general.StandardList.length; dropDownItem += 1) {
                htmlCode += '<tr><td>' + general.StandardList[dropDownItem] + "</td><td style='text-align: right'>" +
                    this.MakeDropDown(general.StandardList[dropDownItem] + 'General', general.List, '', "style='font-size: 10px; min-width: 110px; max-width: 110px; width: 110px;'") + '</td></tr>';
            }

            htmlCode += "<tr><td>Buy</td><td style='text-align: right'>" + this.MakeDropDown('BuyGeneral', general.BuyList, '', "style='font-size: 10px; min-width: 110px; max-width: 110px; width: 110px;'") + '</td></tr>';
            htmlCode += "<tr><td>Collect</td><td style='text-align: right'>" + this.MakeDropDown('CollectGeneral', general.CollectList, '', "style='font-size: 10px; min-width: 110px; max-width: 110px; width: 110px;'") + '</td></tr>';
            htmlCode += "<tr><td>Income</td><td style='text-align: right'>" + this.MakeDropDown('IncomeGeneral', general.IncomeList, '', "style='font-size: 10px; min-width: 110px; max-width: 110px; width: 110px;'") + '</td></tr>';
            htmlCode += "<tr><td>Banking</td><td style='text-align: right'>" + this.MakeDropDown('BankingGeneral', general.BankingList, '', "style='font-size: 10px; min-width: 110px; max-width: 110px; width: 110px;'") + '</td></tr>';
            htmlCode += "<tr><td>Level Up</td><td style='text-align: right'>" + this.MakeDropDown('LevelUpGeneral', general.List, '', "style='font-size: 10px; min-width: 110px; max-width: 110px; width: 110px;'") + '</td></tr></table>';
            htmlCode += "<div id='caap_LevelUpGeneralHide' style='display: " + (config.getItem('LevelUpGeneral', 'Use Current') !== 'Use Current' ? 'block' : 'none') + "'>";
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td>&nbsp;&nbsp;&nbsp;Exp To Use Gen </td><td style='text-align: right'>" + this.MakeNumberForm('LevelUpGeneralExp', LevelUpGenExpInstructions, 20, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr>';
            htmlCode += this.MakeCheckTR("&nbsp;&nbsp;&nbsp;Gen For Idle", 'IdleLevelUpGeneral', true, '', LevelUpGenInstructions1);
            htmlCode += this.MakeCheckTR("&nbsp;&nbsp;&nbsp;Gen For Monsters", 'MonsterLevelUpGeneral', true, '', LevelUpGenInstructions2);
            htmlCode += this.MakeCheckTR("&nbsp;&nbsp;&nbsp;Gen For Guild Monsters", 'GuildMonsterLevelUpGeneral', true, '', LevelUpGenInstructions12);
            htmlCode += this.MakeCheckTR("&nbsp;&nbsp;&nbsp;Gen For Fortify", 'FortifyLevelUpGeneral', true, '', LevelUpGenInstructions3);
            htmlCode += this.MakeCheckTR("&nbsp;&nbsp;&nbsp;Gen For Invades", 'InvadeLevelUpGeneral', true, '', LevelUpGenInstructions4);
            htmlCode += this.MakeCheckTR("&nbsp;&nbsp;&nbsp;Gen For Duels", 'DuelLevelUpGeneral', true, '', LevelUpGenInstructions5);
            htmlCode += this.MakeCheckTR("&nbsp;&nbsp;&nbsp;Gen For Wars", 'WarLevelUpGeneral', true, '', LevelUpGenInstructions6);
            htmlCode += this.MakeCheckTR("&nbsp;&nbsp;&nbsp;Gen For SubQuests", 'SubQuestLevelUpGeneral', true, '', LevelUpGenInstructions7);
            htmlCode += this.MakeCheckTR("&nbsp;&nbsp;&nbsp;Gen For MainQuests", 'QuestLevelUpGeneral', false, '', LevelUpGenInstructions8);
            htmlCode += this.MakeCheckTR("&nbsp;&nbsp;&nbsp;Don't Bank After", 'NoBankAfterLvl', true, '', LevelUpGenInstructions9);
            htmlCode += this.MakeCheckTR("&nbsp;&nbsp;&nbsp;Don't Income After", 'NoIncomeAfterLvl', true, '', LevelUpGenInstructions10);
            htmlCode += this.MakeCheckTR("&nbsp;&nbsp;&nbsp;Prioritise Monster After", 'PrioritiseMonsterAfterLvl', false, '', LevelUpGenInstructions11);
            htmlCode += "</table></div>";
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR("Reverse Under Level 4 Order", 'ReverseLevelUpGenerals', false, '', reverseGenInstructions) + "</table>";
            htmlCode += "<hr/></div>";
            return htmlCode;
        } catch (err) {
            utility.error("ERROR in AddGeneralsMenu: " + err);
            return '';
        }
    },

    AddSkillPointsMenu: function () {
        try {
            var statusInstructions = "Automatically increase attributes when " +
                    "upgrade skill points are available.",
                statusAdvInstructions = "USE WITH CAUTION: You can use numbers or " +
                    "formulas(ie. level * 2 + 10). Variable keywords include energy, " +
                    "health, stamina, attack, defense, and level. JS functions can be " +
                    "used (Math.min, Math.max, etc) !!!Remember your math class: " +
                    "'level + 20' not equals 'level * 2 + 10'!!!",
                statImmedInstructions = "Update Stats Immediately",
                statSpendAllInstructions = "If selected then spend all possible points and don't save for stamina upgrade.",
                attrList = [
                    '',
                    'Energy',
                    'Attack',
                    'Defense',
                    'Stamina',
                    'Health'
                ],
                htmlCode = '';

            htmlCode += this.ToggleControl('Status', 'UPGRADE SKILL POINTS');
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR("Auto Add Upgrade Points", 'AutoStat', false, 'AutoStat_Adv', statusInstructions, true);
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR("Spend All Possible", 'StatSpendAll', false, '', statSpendAllInstructions);
            htmlCode += this.MakeCheckTR("Upgrade Immediately", 'StatImmed', false, '', statImmedInstructions);
            htmlCode += this.MakeCheckTR("Advanced Settings <a href='http://userscripts.org/posts/207279' target='_blank' style='color: blue'>(INFO)</a>", 'AutoStatAdv', false, '', statusAdvInstructions) + "</table>";
            htmlCode += "<div id='caap_Status_Normal' style='display: " + (config.getItem('AutoStatAdv', false) ? 'none' : 'block') + "'>";
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td style='width: 25%; text-align: right'>Increase</td><td style='width: 50%; text-align: center'>" +
                this.MakeDropDown('Attribute0', attrList, '', "style='font-size: 10px'") + "</td><td style='width: 5%; text-align: center'>to</td><td style='width: 20%; text-align: right'>" +
                this.MakeNumberForm('AttrValue0', statusInstructions, 0, "size='3' style='font-size: 10px; text-align: right'", 'text') + " </td></tr>";
            htmlCode += "<tr><td style='width: 25%; text-align: right'>Then</td><td style='width: 50%; text-align: center'>" +
                this.MakeDropDown('Attribute1', attrList, '', "style='font-size: 10px'") + "</td><td style='width: 5%; text-align: center'>to</td><td style='width: 20%; text-align: right'>" +
                this.MakeNumberForm('AttrValue1', statusInstructions, 0, "size='3' style='font-size: 10px; text-align: right'", 'text') + " </td></tr>";
            htmlCode += "<tr><td style='width: 25%; text-align: right'>Then</td><td style='width: 50%; text-align: center'>" +
                this.MakeDropDown('Attribute2', attrList, '', "style='font-size: 10px'") + "</td><td style='width: 5%; text-align: center'>to</td><td style='width: 20%; text-align: right'>" +
                this.MakeNumberForm('AttrValue2', statusInstructions, 0, "size='3' style='font-size: 10px; text-align: right'", 'text') + " </td></tr>";
            htmlCode += "<tr><td style='width: 25%; text-align: right'>Then</td><td style='width: 50%; text-align: center'>" +
                this.MakeDropDown('Attribute3', attrList, '', "style='font-size: 10px'") + "</td><td style='width: 5%; text-align: center'>to</td><td style='width: 20%; text-align: right'>" +
                this.MakeNumberForm('AttrValue3', statusInstructions, 0, "size='3' style='font-size: 10px; text-align: right'", 'text') + " </td></tr>";
            htmlCode += "<tr><td style='width: 25%; text-align: right'>Then</td><td style='width: 50%; text-align: center'>" +
                this.MakeDropDown('Attribute4', attrList, '', "style='font-size: 10px'") + "</td><td style='width: 5%; text-align: center'>to</td><td style='width: 20%; text-align: right'>" +
                this.MakeNumberForm('AttrValue4', statusInstructions, 0, "size='3' style='font-size: 10px; text-align: right'", 'text') + " </td></tr></table>";
            htmlCode += "</div>";
            htmlCode += "<div id='caap_Status_Adv' style='display: " + (config.getItem('AutoStatAdv', false) ? 'block' : 'none') + "'>";
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td style='width: 25%; text-align: right'>Increase</td><td style='width: 50%; text-align: center'>" +
                this.MakeDropDown('Attribute5', attrList, '', "style='font-size: 10px'") + "</td><td style='width: 25%; text-align: left'>using</td></tr>";
            htmlCode += "<tr><td colspan='3'>" + this.MakeNumberForm('AttrValue5', statusInstructions, 0, "size='7' style='font-size: 10px; width : 98%'", 'text') + " </td></tr>";
            htmlCode += "<tr><td style='width: 25%; text-align: right'>Then</td><td style='width: 50%; text-align: center'>" +
                this.MakeDropDown('Attribute6', attrList, '', "style='font-size: 10px'") + "</td><td style='width: 25%'>using</td></tr>";
            htmlCode += "<tr><td colspan='3'>" + this.MakeNumberForm('AttrValue6', statusInstructions, 0, "size='7' style='font-size: 10px; width : 98%'", 'text') + " </td></tr>";
            htmlCode += "<tr><td style='width: 25%; text-align: right'>Then</td><td style='width: 50%; text-align: center'>" +
                this.MakeDropDown('Attribute7', attrList, '', "style='font-size: 10px'") + "</td><td style='width: 25%'>using</td></tr>";
            htmlCode += "<tr><td colspan='3'>" + this.MakeNumberForm('AttrValue7', statusInstructions, 0, "size='7' style='font-size: 10px; width : 98%'", 'text') + " </td></tr>";
            htmlCode += "<tr><td style='width: 25%; text-align: right'>Then</td><td style='width: 50%; text-align: center'>" +
                this.MakeDropDown('Attribute8', attrList, '', "style='font-size: 10px'") + "</td><td style='width: 25%'>using</td></tr>";
            htmlCode += "<tr><td colspan='3'>" + this.MakeNumberForm('AttrValue8', statusInstructions, 0, "size='7' style='font-size: 10px; width : 98%'", 'text') + " </td></tr>";
            htmlCode += "<tr><td style='width: 25%; text-align: right'>Then</td><td style='width: 50%; text-align: center'>" +
                this.MakeDropDown('Attribute9', attrList, '', "style='font-size: 10px'") + "</td><td style='width: 25%'>using</td></tr>";
            htmlCode += "<tr><td colspan='3'>" + this.MakeNumberForm('AttrValue9', statusInstructions, 0, "size='7' style='font-size: 10px; width : 98%'", 'text') + " </td></tr></table>";
            htmlCode += "</div>";
            htmlCode += "</table></div>";
            htmlCode += "<hr/></div>";
            return htmlCode;
        } catch (err) {
            utility.error("ERROR in AddSkillPointsMenu: " + err);
            return '';
        }
    },

    AddGiftingOptionsMenu: function () {
        try {
            // Other controls
            var giftInstructions = "Automatically receive and send return gifts.",
                giftQueueUniqueInstructions = "When enabled only unique user's gifts will be queued, otherwise all received gifts will be queued.",
                giftCollectOnlyInstructions = "Only collect gifts, do not queue and do not return.",
                giftCollectAndQueueInstructions = "When used with Collect Only it will collect and queue gifts but not return.",
                giftReturnOnlyOneInstructions = "Only return 1 gift to a person in 24 hours even if you received many from that person.",
                htmlCode = '';

            htmlCode += this.ToggleControl('Gifting', 'GIFTING OPTIONS');
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR('Auto Gifting', 'AutoGift', false, 'GiftControl', giftInstructions, true);
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR('Queue unique users only', 'UniqueGiftQueue', true, '', giftQueueUniqueInstructions);
            htmlCode += this.MakeCheckTR('Collect Only', 'CollectOnly', false, 'CollectOnly_Adv', giftCollectOnlyInstructions, true);
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR('&nbsp;&nbsp;&nbsp;And Queue', 'CollectAndQueue', false, '', giftCollectAndQueueInstructions) + '</table>';
            htmlCode += '</div>';
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td style='width: 25%'>Give</td><td style='text-align: right'>" +
                this.MakeDropDown('GiftChoice', gifting.gifts.list(), '', "style='font-size: 10px; width: 100%'") + '</td></tr></table>';
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR('1 Gift Per Person Per 24hrs', 'ReturnOnlyOne', false, '', giftReturnOnlyOneInstructions);

            htmlCode += this.MakeCheckTR('Filter Return By UserId', 'FilterReturnId', false, 'FilterReturnIdControl', '', true) + '</table>';
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += '<tr><td>' + this.MakeTextBox('FilterReturnIdList', "Don't return gifts to these UserIDs. Use ',' between each UserID", '', '') + '</td></tr></table>';
            htmlCode += '</div>';

            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR('Filter Return By Gift', 'FilterReturnGift', false, 'FilterReturnGiftControl', '', true) + '</table>';
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += '<tr><td>' + this.MakeTextBox('FilterReturnGiftList', "Don't return gifts to these received gifts. Use ',' between each gift", '', '') + '</td></tr></table>';
            htmlCode += '</div>';

            htmlCode += '</div>';
            htmlCode += "<hr/></div>";
            return htmlCode;
        } catch (err) {
            utility.error("ERROR in AddGiftingOptionsMenu: " + err);
            return '';
        }
    },

    AddEliteGuardOptionsMenu: function () {
        try {
            // Other controls
            var autoEliteInstructions = "Enable or disable Auto Elite function",
                autoEliteIgnoreInstructions = "Use this option if you have a small " +
                    "army and are unable to fill all 10 Elite positions. This prevents " +
                    "the script from checking for any empty places and will cause " +
                    "Auto Elite to run on its timer only.",
                htmlCode = '';

            htmlCode += this.ToggleControl('Elite', 'ELITE GUARD OPTIONS');
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR('Auto Elite Army', 'AutoElite', false, 'AutoEliteControl', autoEliteInstructions, true);
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR('Timed Only', 'AutoEliteIgnore', false, '', autoEliteIgnoreInstructions) + '</table>';
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td><input type='button' id='caap_resetElite' value='Do Now' style='padding: 0; font-size: 10px; height: 18px' /></tr></td>";
            htmlCode += '<tr><td>' + this.MakeTextBox('EliteArmyList', "Try these UserIDs first. Use ',' between each UserID", '', '') + '</td></tr></table>';
            htmlCode += '</div>';
            htmlCode += "<hr/></div>";
            return htmlCode;
        } catch (err) {
            utility.error("ERROR in AddEliteGuardOptionsMenu: " + err);
            return '';
        }
    },

    AddAutoOptionsMenu: function () {
        try {
            // Other controls
            var autoCollectMAInstructions = "Auto collect your Master and Apprentice rewards.",
                autoAlchemyInstructions1 = "AutoAlchemy will combine all recipes " +
                    "that do not have missing ingredients. By default, it will not " +
                    "combine Battle Hearts recipes.",
                autoAlchemyInstructions2 = "If for some reason you do not want " +
                    "to skip Battle Hearts",
                autoPotionsInstructions0 = "Enable or disable the auto consumption " +
                    "of energy and stamina potions.",
                autoPotionsInstructions1 = "Number of stamina potions at which to " +
                    "begin consuming.",
                autoPotionsInstructions2 = "Number of stamina potions to keep.",
                autoPotionsInstructions3 = "Number of energy potions at which to " +
                    "begin consuming.",
                autoPotionsInstructions4 = "Number of energy potions to keep.",
                autoPotionsInstructions5 = "Do not consume potions if the " +
                    "experience points to the next level are within this value.",
                autoBlessList = [
                    'None',
                    'Energy',
                    'Attack',
                    'Defense',
                    'Health',
                    'Stamina'
                ],
                autoBlessListInstructions = [
                    'None disables the auto bless feature.',
                    'Energy performs an automatic daily blessing with Ambrosia.',
                    'Attack performs an automatic daily blessing with Malekus.',
                    'Defense performs an automatic daily blessing with Corvintheus.',
                    'Health performs an automatic daily blessing with Aurora.',
                    'Stamina performs an automatic daily blessing with Azeron.'
                ],
                htmlCode = '';

            htmlCode += this.ToggleControl('Auto', 'AUTO OPTIONS');
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR('Auto Collect MA', 'AutoCollectMA', false, '', autoCollectMAInstructions);
            htmlCode += this.MakeCheckTR('Auto Alchemy', 'AutoAlchemy', false, 'AutoAlchemy_Adv', autoAlchemyInstructions1, true);
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR('&nbsp;&nbsp;&nbsp;Do Battle Hearts', 'AutoAlchemyHearts', false, '', autoAlchemyInstructions2) + '</td></tr></table>';
            htmlCode += '</div>';
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR('Auto Potions', 'AutoPotions', false, 'AutoPotions_Adv', autoPotionsInstructions0, true);
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td style='padding-left: 10px'>Spend Stamina Potions At</td><td style='text-align: right'>" +
                this.MakeNumberForm('staminaPotionsSpendOver', autoPotionsInstructions1, 39, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr>';
            htmlCode += "<tr><td style='padding-left: 10px'>Keep Stamina Potions</td><td style='text-align: right'>" +
                this.MakeNumberForm('staminaPotionsKeepUnder', autoPotionsInstructions2, 35, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr>';
            htmlCode += "<tr><td style='padding-left: 10px'>Spend Energy Potions At</td><td style='text-align: right'>" +
                this.MakeNumberForm('energyPotionsSpendOver', autoPotionsInstructions3, 39, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr>';
            htmlCode += "<tr><td style='padding-left: 10px'>Keep Energy Potions</td><td style='text-align: right'>" +
                this.MakeNumberForm('energyPotionsKeepUnder', autoPotionsInstructions4, 35, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr>';
            htmlCode += "<tr><td style='padding-left: 10px'>Wait If Exp. To Level</td><td style='text-align: right'>" +
                this.MakeNumberForm('potionsExperience', autoPotionsInstructions5, 20, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr></table>';
            htmlCode += '</div>';
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px' style='margin-top: 3px'>";
            htmlCode += "<tr><td style='width: 50%'>Auto bless</td><td style='text-align: right'>" +
                this.MakeDropDown('AutoBless', autoBlessList, autoBlessListInstructions, "style='font-size: 10px; width: 100%'") + '</td></tr></table>';
            htmlCode += "<hr/></div>";
            return htmlCode;
        } catch (err) {
            utility.error("ERROR in AddAutoOptionsMenu: " + err);
            return '';
        }
    },

    AddOtherOptionsMenu: function () {
        try {
            // Other controls
            var timeInstructions = "Use 24 hour format for displayed times.",
                titleInstructions0 = "Set the title bar.",
                titleInstructions1 = "Add the current action.",
                titleInstructions2 = "Add the player name.",
                hideAdsInstructions = "Hides the sidebar adverts.",
                hideAdsIframeInstructions = "Hide the FaceBook Iframe adverts",
                hideFBChatInstructions = "Hide the FaceBook Chat",
                newsSummaryInstructions = "Enable or disable the news summary on the index page.",
                bannerInstructions = "Uncheck if you wish to hide the CAAP banner.",
                styleList = [
                    'CA Skin',
                    'Original',
                    'Custom',
                    'None'
                ],
                htmlCode = '';

            htmlCode += this.ToggleControl('Other', 'OTHER OPTIONS');
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR('Display Item Titles', 'enableTitles', true, '', '');
            htmlCode += this.MakeCheckTR('Do Goblin Hinting', 'goblinHinting', true, '', '');
            htmlCode += this.MakeCheckTR('Display CAAP Banner', 'BannerDisplay', true, '', bannerInstructions);
            htmlCode += this.MakeCheckTR('Use 24 Hour Format', 'use24hr', true, '', timeInstructions);
            htmlCode += this.MakeCheckTR('Set Title', 'SetTitle', false, 'SetTitle_Adv', titleInstructions0, true);
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR('&nbsp;&nbsp;&nbsp;Display Action', 'SetTitleAction', false, '', titleInstructions1);
            htmlCode += this.MakeCheckTR('&nbsp;&nbsp;&nbsp;Display Name', 'SetTitleName', false, '', titleInstructions2) + '</td></tr></table>';
            htmlCode += '</div>';
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR('Hide Sidebar Adverts', 'HideAds', false, '', hideAdsInstructions);
            htmlCode += this.MakeCheckTR('Hide FB Iframe Adverts', 'HideAdsIframe', false, '', hideAdsIframeInstructions);
            htmlCode += this.MakeCheckTR('Hide FB Chat', 'HideFBChat', false, '', hideFBChatInstructions);
            htmlCode += this.MakeCheckTR('Enable News Summary', 'NewsSummary', true, '', newsSummaryInstructions);
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px' style='margin-top: 3px'>";
            htmlCode += "<tr><td style='width: 50%'>Style</td><td style='text-align: right'>" +
                this.MakeDropDown('DisplayStyle', styleList, '', "style='font-size: 10px; width: 100%'") + '</td></tr></table>';
            htmlCode += "<div id='caap_DisplayStyleHide' style='display: " + (config.getItem('DisplayStyle', 'CA Skin') === 'Custom' ? 'block' : 'none') + "'>";
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td style='padding-left: 10px; font-weight: bold;'>Started</td><td style='text-align: right'>" +
                "<input type='button' id='caap_StartedColorSelect' value='Select' style='padding: 0; font-size: 10px; height: 18px' /></td></tr>";
            htmlCode += "<tr><td style='padding-left: 20px'>RGB Color</td><td style='text-align: right'>" +
                this.MakeNumberForm('StyleBackgroundLight', '#FFF or #FFFFFF', '#E0C691', "size='5' style='font-size: 10px; text-align: right'", 'text') + '</td></tr>';
            htmlCode += "<tr><td style='padding-left: 20px'>Transparency</td><td style='text-align: right'>" +
                this.MakeNumberForm('StyleOpacityLight', '0 ~ 1', 1, "size='5' style='vertical-align: middle; font-size: 10px; text-align: right'") + '</td></tr>';
            htmlCode += "<tr><td style='padding-left: 10px; font-weight: bold;'>Stoped</td><td style='text-align: right'>" +
                "<input type='button' id='caap_StopedColorSelect' value='Select' style='padding: 0; font-size: 10px; height: 18px' /></td></tr>";
            htmlCode += "<tr><td style='padding-left: 20px'>RGB Color</td><td style='text-align: right'>" +
                this.MakeNumberForm('StyleBackgroundDark', '#FFF or #FFFFFF', '#B09060', "size='5' style='font-size: 10px; text-align: right'", 'text') + '</td></tr>';
            htmlCode += "<tr><td style='padding-left: 20px'>Transparency</td><td style='text-align: right'>" +
                this.MakeNumberForm('StyleOpacityDark', '0 ~ 1', 1, "size='5' style='font-size: 10px; text-align: right'") + '</td></tr></table>';
            htmlCode += "</div>";

            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += this.MakeCheckTR('Change Log Level', 'ChangeLogLevel', false, 'ChangeLogLevelControl', '', true) + '</table>';
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td style='padding-left: 10px'>Log Level</td><td style='text-align: right'>" +
                this.MakeNumberForm('DebugLevel', '', 1, "size='2' style='font-size: 10px; text-align: right'") + '</td></tr></table>';
            htmlCode += '</div>';

            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px' style='margin-top: 3px'>";
            htmlCode += "<tr><td><input type='button' id='caap_FillArmy' value='Fill Army' style='padding: 0; font-size: 10px; height: 18px' /></td></tr></table>";
            htmlCode += '</div>';
            htmlCode += "<hr/></div>";
            return htmlCode;
        } catch (err) {
            utility.error("ERROR in AddOtherOptionsMenu: " + err);
            return '';
        }
    },

    AddFooterMenu: function () {
        try {
            var htmlCode = '';
            htmlCode += "<table width='180px' cellpadding='0px' cellspacing='0px'>";
            htmlCode += "<tr><td style='width: 90%'>Unlock Menu <input type='button' id='caap_ResetMenuLocation' value='Reset' style='padding: 0; font-size: 10px; height: 18px' /></td>" +
                "<td style='width: 10%; text-align: right'><input type='checkbox' id='unlockMenu' /></td></tr></table>";

            if (!devVersion) {
                htmlCode += "Version: " + caapVersion + " - <a href='http://senses.ws/caap/index.php' target='_blank'>CAAP Forum</a><br />";
                if (this.newVersionAvailable) {
                    htmlCode += "<a href='http://castle-age-auto-player.googlecode.com/files/Castle-Age-Autoplayer.user.js'>Install new CAAP version: " + state.getItem('SUC_remote_version') + "!</a>";
                }
            } else {
                htmlCode += "Version: " + caapVersion + " d" + devVersion + " - <a href='http://senses.ws/caap/index.php' target='_blank'>CAAP Forum</a><br />";
                if (this.newVersionAvailable) {
                    htmlCode += "<a href='http://castle-age-auto-player.googlecode.com/svn/trunk/Castle-Age-Autoplayer.user.js'>Install new CAAP version: " + state.getItem('SUC_remote_version') + " d" + state.getItem('DEV_remote_version')  + "!</a>";
                }
            }

            return htmlCode;
        } catch (err) {
            utility.error("ERROR in AddFooterMenu: " + err);
            return '';
        }
    },

    AddColorWheels: function () {
        try {
            var fb1call = null,
                fb2call = null;

            fb1call = function (color) {
                $('#caap_ColorSelectorDiv1').css({'background-color': color});
                $('#caap_StyleBackgroundLight').val(color);
                config.setItem("StyleBackgroundLight", color);
                state.setItem("CustStyleBackgroundLight", color);
            };

            $.farbtastic($("<div id='caap_ColorSelectorDiv1'></div>").css({
                background : config.getItem("StyleBackgroundLight", "#E0C691"),
                padding    : "5px",
                border     : "2px solid #000",
                top        : (window.innerHeight / 2) - 100 + 'px',
                left       : (window.innerWidth / 2) - 290 + 'px',
                zIndex     : '1337',
                position   : 'fixed',
                display    : 'none'
            }).appendTo(document.body), fb1call).setColor(config.getItem("StyleBackgroundLight", "#E0C691"));

            fb2call = function (color) {
                $('#caap_ColorSelectorDiv2').css({'background-color': color});
                $('#caap_StyleBackgroundDark').val(color);
                config.setItem("StyleBackgroundDark", color);
                state.setItem("CustStyleBackgroundDark", color);
            };

            $.farbtastic($("<div id='caap_ColorSelectorDiv2'></div>").css({
                background : config.getItem("StyleBackgroundDark", "#B09060"),
                padding    : "5px",
                border     : "2px solid #000",
                top        : (window.innerHeight / 2) - 100 + 'px',
                left       : (window.innerWidth / 2) + 'px',
                zIndex     : '1337',
                position   : 'fixed',
                display    : 'none'
            }).appendTo(document.body), fb2call).setColor(config.getItem("StyleBackgroundDark", "#B09060"));

            return true;
        } catch (err) {
            utility.error("ERROR in AddColorWheels: " + err);
            return false;
        }
    },

    AddDashboard: function () {
        try {
            /*-------------------------------------------------------------------------------------\
             Here is where we construct the HTML for our dashboard. We start by building the outer
             container and position it within the main container.
            \-------------------------------------------------------------------------------------*/
            var layout      = "<div id='caap_top'>",
                displayList = ['Monster', 'Guild Monster', 'Target List', 'Battle Stats', 'User Stats', 'Generals Stats', 'Soldier Stats', 'Item Stats', 'Magic Stats', 'Gifting Stats', 'Gift Queue'],
                styleXY = {
                    x: 0,
                    y: 0
                };
            /*-------------------------------------------------------------------------------------\
             Next we put in our Refresh Monster List button which will only show when we have
             selected the Monster display.
            \-------------------------------------------------------------------------------------*/
            layout += "<div id='caap_buttonMonster' style='position:absolute;top:0px;left:250px;display:" +
                (config.getItem('DBDisplay', 'Monster') === 'Monster' ? 'block' : 'none') + "'><input type='button' id='caap_refreshMonsters' value='Refresh Monster List' style='padding: 0; font-size: 9px; height: 18px' /></div>";
            /*-------------------------------------------------------------------------------------\
             Next we put in our Refresh Guild Monster List button which will only show when we have
             selected the Guild Monster display.
            \-------------------------------------------------------------------------------------*/
            layout += "<div id='caap_buttonGuildMonster' style='position:absolute;top:0px;left:250px;display:" +
                (config.getItem('DBDisplay', 'Monster') === 'Guild Monster' ? 'block' : 'none') + "'><input type='button' id='caap_refreshGuildMonsters' value='Refresh Guild Monster List' style='padding: 0; font-size: 9px; height: 18px' /></div>";
            /*-------------------------------------------------------------------------------------\
             Next we put in the Clear Target List button which will only show when we have
             selected the Target List display
            \-------------------------------------------------------------------------------------*/
            layout += "<div id='caap_buttonTargets' style='position:absolute;top:0px;left:250px;display:" +
                (config.getItem('DBDisplay', 'Monster') === 'Target List' ? 'block' : 'none') + "'><input type='button' id='caap_clearTargets' value='Clear Targets List' style='padding: 0; font-size: 9px; height: 18px' /></div>";
            /*-------------------------------------------------------------------------------------\
             Next we put in the Clear Battle Stats button which will only show when we have
             selected the Target List display
            \-------------------------------------------------------------------------------------*/
            layout += "<div id='caap_buttonBattle' style='position:absolute;top:0px;left:250px;display:" +
                (config.getItem('DBDisplay', 'Monster') === 'Battle Stats' ? 'block' : 'none') + "'><input type='button' id='caap_clearBattle' value='Clear Battle Stats' style='padding: 0; font-size: 9px; height: 18px' /></div>";
            /*-------------------------------------------------------------------------------------\
             Next we put in the Clear Gifting Stats button which will only show when we have
             selected the Target List display
            \-------------------------------------------------------------------------------------*/
            layout += "<div id='caap_buttonGifting' style='position:absolute;top:0px;left:250px;display:" +
                (config.getItem('DBDisplay', 'Monster') === 'Gifting Stats' ? 'block' : 'none') + "'><input type='button' id='caap_clearGifting' value='Clear Gifting Stats' style='padding: 0; font-size: 9px; height: 18px' /></div>";
            /*-------------------------------------------------------------------------------------\
             Next we put in the Clear Gift Queue button which will only show when we have
             selected the Target List display
            \-------------------------------------------------------------------------------------*/
            layout += "<div id='caap_buttonGiftQueue' style='position:absolute;top:0px;left:250px;display:" +
                (config.getItem('DBDisplay', 'Monster') === 'Gift Queue' ? 'block' : 'none') + "'><input type='button' id='caap_clearGiftQueue' value='Clear Gift Queue' style='padding: 0; font-size: 9px; height: 18px' /></div>";
            /*-------------------------------------------------------------------------------------\
             Then we put in the Live Feed link since we overlay the Castle Age link.
            \-------------------------------------------------------------------------------------*/
            layout += "<div id='caap_buttonFeed' style='position:absolute;top:0px;left:0px;'><input id='caap_liveFeed' type='button' value='LIVE FEED! Your friends are calling.' style='padding: 0; font-size: 9px; height: 18px' /></div>";
            /*-------------------------------------------------------------------------------------\
             We install the display selection box that allows the user to toggle through the
             available displays.
            \-------------------------------------------------------------------------------------*/
            layout += "<div id='caap_DBDisplay' style='font-size: 9px;position:absolute;top:0px;right:5px;'>Display: " +
                this.DBDropDown('DBDisplay', displayList, '', "style='font-size: 9px; min-width: 120px; max-width: 120px; width : 120px;'") + "</div>";
            /*-------------------------------------------------------------------------------------\
            And here we build our empty content divs.  We display the appropriate div
            depending on which display was selected using the control above
            \-------------------------------------------------------------------------------------*/
            layout += "<div id='caap_infoMonster' style='position:relative;top:15px;width:610px;height:165px;overflow:auto;display:" + (config.getItem('DBDisplay', 'Monster') === 'Monster' ? 'block' : 'none') + "'></div>";
            layout += "<div id='caap_guildMonster' style='position:relative;top:15px;width:610px;height:165px;overflow:auto;display:" + (config.getItem('DBDisplay', 'Monster') === 'Guild Monster' ? 'block' : 'none') + "'></div>";
            layout += "<div id='caap_infoTargets1' style='position:relative;top:15px;width:610px;height:165px;overflow:auto;display:" + (config.getItem('DBDisplay', 'Monster') === 'Target List' ? 'block' : 'none') + "'></div>";
            layout += "<div id='caap_infoBattle' style='position:relative;top:15px;width:610px;height:165px;overflow:auto;display:" + (config.getItem('DBDisplay', 'Monster') === 'Battle Stats' ? 'block' : 'none') + "'></div>";
            layout += "<div id='caap_userStats' style='position:relative;top:15px;width:610px;height:165px;overflow:auto;display:" + (config.getItem('DBDisplay', 'Monster') === 'User Stats' ? 'block' : 'none') + "'></div>";
            layout += "<div id='caap_generalsStats' style='position:relative;top:15px;width:610px;height:165px;overflow:auto;display:" + (config.getItem('DBDisplay', 'Monster') === 'Generals Stats' ? 'block' : 'none') + "'></div>";
            layout += "<div id='caap_soldiersStats' style='position:relative;top:15px;width:610px;height:165px;overflow:auto;display:" + (config.getItem('DBDisplay', 'Monster') === 'Soldier Stats' ? 'block' : 'none') + "'></div>";
            layout += "<div id='caap_itemStats' style='position:relative;top:15px;width:610px;height:165px;overflow:auto;display:" + (config.getItem('DBDisplay', 'Monster') === 'Item Stats' ? 'block' : 'none') + "'></div>";
            layout += "<div id='caap_magicStats' style='position:relative;top:15px;width:610px;height:165px;overflow:auto;display:" + (config.getItem('DBDisplay', 'Monster') === 'Magic Stats' ? 'block' : 'none') + "'></div>";
            layout += "<div id='caap_giftStats' style='position:relative;top:15px;width:610px;height:165px;overflow:auto;display:" + (config.getItem('DBDisplay', 'Monster') === 'Gifting Stats' ? 'block' : 'none') + "'></div>";
            layout += "<div id='caap_giftQueue' style='position:relative;top:15px;width:610px;height:165px;overflow:auto;display:" + (config.getItem('DBDisplay', 'Monster') === 'Gift Queue' ? 'block' : 'none') + "'></div>";
            layout += "</div>";
            /*-------------------------------------------------------------------------------------\
             No we apply our CSS to our container
            \-------------------------------------------------------------------------------------*/
            this.dashboardXY.x = state.getItem('caap_top_menuLeft', '');
            this.dashboardXY.y = state.getItem('caap_top_menuTop', $(this.dashboardXY.selector).offset().top - 10);
            styleXY = this.GetDashboardXY();
            $(layout).css({
                background              : config.getItem("StyleBackgroundLight", "white"),
                padding                 : "5px",
                height                  : "185px",
                width                   : "610px",
                margin                  : "0 auto",
                opacity                 : config.getItem('StyleOpacityLight', 1),
                top                     : styleXY.y + 'px',
                left                    : styleXY.x + 'px',
                zIndex                  : state.getItem('caap_top_zIndex', 1),
                position                : 'absolute',
                '-moz-border-radius'    : '5px',
                '-webkit-border-radius' : '5px'
            }).appendTo(document.body);

            this.caapTopObject = $('#caap_top');
            this.caapTopObject.find("#caap_refreshMonsters").button();
            this.caapTopObject.find("#caap_refreshGuildMonsters").button();
            this.caapTopObject.find("#caap_clearTargets").button();
            this.caapTopObject.find("#caap_clearBattle").button();
            this.caapTopObject.find("#caap_clearGifting").button();
            this.caapTopObject.find("#caap_clearGiftQueue").button();
            this.caapTopObject.find("#caap_liveFeed").button();

            return true;
        } catch (err) {
            utility.error("ERROR in AddDashboard: " + err);
            return false;
        }
    },

    /////////////////////////////////////////////////////////////////////
    //                      MONSTERS DASHBOARD
    // Display the current monsters and stats
    /////////////////////////////////////////////////////////////////////
    decHours2HoursMin : function (decHours) {
        utility.log(9, "decHours2HoursMin", decHours);
        var hours   = 0,
            minutes = 0;

        hours = Math.floor(decHours);
        minutes = parseInt((decHours - hours) * 60, 10);
        if (minutes < 10) {
            minutes = '0' + minutes;
        }

        return (hours + ':' + minutes);
    },

    makeCommaValue: function (nStr) {
        nStr += '';
        var x   = nStr.split('.'),
            x1  = x[0],
            rgx = /(\d+)(\d{3})/;

        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }

        return x1;
    },

    makeTh: function (obj) {
        var header = {text: '', color: '', id: '', title: '', width: ''},
        html       = '<th';

        header = obj;
        if (!header.color) {
            header.color = 'black';
        }

        if (header.id) {
            html += " id='" + header.id + "'";
        }

        if (header.title) {
            html += " title='" + header.title + "'";
        }

        if (header.width) {
            html += " width='" + header.width + "'";
        }

        html += " style='color:" + header.color + ";font-size:10px;font-weight:bold'>" + header.text + "</th>";
        return html;
    },

    makeTd: function (obj) {
        var data = {text: '', color: '', id: '',  title: ''},
            html = '<td';

        data = obj;
        if (!data.color) {
            data.color = 'black';
        }

        if (data.id) {
            html += " id='" + data.id + "'";
        }

        if (data.title) {
            html += " title='" + data.title + "'";
        }

        html += " style='color:" + data.color + ";font-size:10px'>" + data.text + "</td>";
        return html;
    },

    UpdateDashboardWaitLog: true,

    UpdateDashboard: function (force) {
        try {
            var html                     = '',
                monsterList              = [],
                color                    = '',
                value                    = 0,
                headers                  = [],
                values                   = [],
                generalValues            = [],
                townValues               = [],
                pp                       = 0,
                i                        = 0,
                newTime                  = new Date(),
                count                    = 0,
                monsterObjLink           = '',
                visitMonsterLink         = '',
                visitMonsterInstructions = '',
                removeLink               = '',
                removeLinkInstructions   = '',
                shortMonths              = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                userIdLink               = '',
                userIdLinkInstructions   = '',
                id                       = '',
                title                    = '',
                monsterConditions        = '',
                achLevel                 = 0,
                maxDamage                = 0,
                titleCol                 = 'black',
                valueCol                 = 'red',
                it                       = 0,
                len                      = 0,
                len1                     = 0,
                len2                     = 0,
                str                      = '',
                header                   = {text: '', color: '', id: '', title: '', width: ''},
                data                     = {text: '', color: '', id: '', title: ''},
                width                    = '',
                linkRegExp               = new RegExp("'(http:.+)'"),
                statsRegExp              = new RegExp("caap_.*Stats_"),
                handler;

            if (this.caapTopObject.length === 0) {
                throw "We are missing the Dashboard div!";
            }

            if (!force && !utility.oneMinuteUpdate('dashboard') && $('#caap_infoMonster').html()) {
                if (this.UpdateDashboardWaitLog) {
                    utility.log(3, "Dashboard update is waiting on oneMinuteUpdate");
                    this.UpdateDashboardWaitLog = false;
                }

                return false;
            }

            utility.log(3, "Updating Dashboard");
            this.UpdateDashboardWaitLog = true;
            if (state.getItem("MonsterDashUpdate", true)) {
                html = "<table width='100%' cellpadding='0px' cellspacing='0px'><tr>";
                headers = ['Name', 'Damage', 'Damage%', 'Fort%', 'Stre%', 'TimeLeft', 'T2K', 'Phase', 'Link', '&nbsp;', '&nbsp;'];
                values  = ['name', 'damage', 'life', 'fortify', 'strength', 'time', 't2k', 'phase', 'link'];
                for (pp = 0, len = headers.length; pp < len; pp += 1) {
                    width = '';
                    if (headers[pp] === 'Name') {
                        width = '30%';
                    }

                    html += this.makeTh({text: headers[pp], color: '', id: '', title: '', width: width});
                }

                html += '</tr>';
                values.shift();
                utility.log(9, "monsterList", monsterList);
                monster.records.forEach(function (monsterObj) {
                    utility.log(9, "monsterObj", monsterObj);
                    color = '';
                    html += "<tr>";
                    if (monsterObj.name === state.getItem('targetFromfortify', new monster.energyTarget().data).name) {
                        color = 'blue';
                    } else if (monsterObj.name === state.getItem('targetFromraid', '') || monsterObj.name === state.getItem('targetFrombattle_monster', '')) {
                        color = 'green';
                    } else {
                        color = monsterObj.color;
                    }

                    achLevel = 0;
                    maxDamage = 0;
                    monsterConditions = monsterObj.conditions;
                    if (monsterConditions) {
                        achLevel = monster.parseCondition('ach', monsterConditions);
                        maxDamage = monster.parseCondition('max', monsterConditions);
                    }

                    monsterObjLink = monsterObj.link;
                    utility.log(9, "monsterObjLink", monsterObjLink);
                    if (monsterObjLink) {
                        visitMonsterLink = monsterObjLink.replace("&action=doObjective", "").match(linkRegExp);
                        utility.log(9, "visitMonsterLink", visitMonsterLink);
                        visitMonsterInstructions = "Clicking this link will take you to " + monsterObj.name;
                        data = {
                            text  : '<span id="caap_monster_' + count + '" title="' + visitMonsterInstructions + '" mname="' + monsterObj.name + '" rlink="' + visitMonsterLink[1] +
                                    '" onmouseover="this.style.cursor=\'pointer\';" onmouseout="this.style.cursor=\'default\';">' + monsterObj.name + '</span>',
                            color : color,
                            id    : '',
                            title : ''
                        };

                        html += caap.makeTd(data);
                    } else {
                        html += caap.makeTd({text: monsterObj.name, color: color, id: '', title: ''});
                    }

                    values.forEach(function (displayItem) {
                        utility.log(9, 'displayItem/value ', displayItem, monsterObj[displayItem]);
                        id = "caap_" + displayItem + "_" + count;
                        title = '';
                        if (displayItem === 'phase' && color === 'grey') {
                            html += caap.makeTd({text: monsterObj.status, color: color, id: '', title: ''});
                        } else {
                            value = monsterObj[displayItem];
                            if ((value !== '' && value >= 0) || (value !== '' && isNaN(value))) {
                                if (parseInt(value, 10) === value && value > 999) {
                                    utility.log(9, 'makeCommaValue ', value);
                                    value = caap.makeCommaValue(value);
                                }

                                switch (displayItem) {
                                case 'damage' :
                                    if (achLevel) {
                                        title = "User Set Monster Achievement: " + caap.makeCommaValue(achLevel);
                                    } else if (config.getItem('AchievementMode', false)) {
                                        if (monster.info[monsterObj.type]) {
                                            title = "Default Monster Achievement: " + caap.makeCommaValue(monster.info[monsterObj.type].ach);
                                        }
                                    } else {
                                        title = "Achievement Mode Disabled";
                                    }

                                    if (maxDamage) {
                                        title += " - User Set Max Damage: " + caap.makeCommaValue(maxDamage);
                                    }

                                    break;
                                case 'time' :
                                    if (value && value.length === 3) {
                                        value = value[0] + ":" + value[1];
                                        if (monster.info[monsterObj.type]) {
                                            title = "Total Monster Duration: " + monster.info[monsterObj.type].duration + " hours";
                                        }
                                    } else {
                                        value = '';
                                    }

                                    break;
                                case 't2k' :
                                    value = caap.decHours2HoursMin(value);
                                    title = "Estimated Time To Kill: " + value + " hours:mins";
                                    break;
                                case 'life' :
                                    value = value.toFixed(2);
                                    title = "Percentage of monster life remaining: " + value + "%";
                                    break;
                                case 'phase' :
                                    value = value + "/" + monster.info[monsterObj.type].siege + " need " + monsterObj.miss;
                                    title = "Percentage of monster life remaining: " + value + "%";
                                    break;
                                case 'fortify' :
                                    value = value.toFixed(2);
                                    title = "Percentage of party health/monster defense: " + value + "%";
                                    break;
                                case 'strength' :
                                    value = value.toFixed(2);
                                    title = "Percentage of party strength: " + value + "%";
                                    break;
                                default :
                                }

                                html += caap.makeTd({text: value, color: color, id: id, title: title});
                            } else {
                                html += caap.makeTd({text: '', color: color, id: '', title: ''});
                            }
                        }
                    });

                    if (monsterConditions && monsterConditions !== 'none') {
                        data = {
                            text  : '<span title="User Set Conditions: ' + monsterConditions + '" class="ui-icon ui-icon-info">i</span>',
                            color : 'blue',
                            id    : '',
                            title : ''
                        };

                        html += caap.makeTd(data);
                    } else {
                        html += caap.makeTd({text: '', color: color, id: '', title: ''});
                    }

                    if (monsterObjLink) {
                        removeLink = monsterObjLink.replace("casuser", "remove_list").replace("&action=doObjective", "").match(linkRegExp);
                        utility.log(9, "removeLink", removeLink);
                        removeLinkInstructions = "Clicking this link will remove " + monsterObj.name + " from both CA and CAAP!";
                        data = {
                            text  : '<span id="caap_remove_' + count + '" title="' + removeLinkInstructions + '" mname="' + monsterObj.name + '" rlink="' + removeLink[1] +
                                    '" onmouseover="this.style.cursor=\'pointer\';" onmouseout="this.style.cursor=\'default\';" class="ui-icon ui-icon-circle-close">X</span>',
                            color : 'blue',
                            id    : '',
                            title : ''
                        };

                        html += caap.makeTd(data);
                    } else {
                        html += caap.makeTd({text: '', color: color, id: '', title: ''});
                    }

                    html += '</tr>';
                    count += 1;
                });

                html += '</table>';
                this.caapTopObject.find("#caap_infoMonster").html(html);

                handler = function (e) {
                    utility.log(9, "Clicked", e.target.id);
                    var visitMonsterLink = {
                        mname     : '',
                        rlink     : '',
                        arlink    : ''
                    },
                    i = 0,
                    len = 0;

                    for (i = 0, len = e.target.attributes.length; i < len; i += 1) {
                        if (e.target.attributes[i].nodeName === 'mname') {
                            visitMonsterLink.mname = e.target.attributes[i].nodeValue;
                        } else if (e.target.attributes[i].nodeName === 'rlink') {
                            visitMonsterLink.rlink = e.target.attributes[i].nodeValue;
                            visitMonsterLink.arlink = visitMonsterLink.rlink.replace("http://apps.facebook.com/castle_age/", "");
                        }
                    }

                    utility.log(9, 'visitMonsterLink', visitMonsterLink);
                    utility.ClickAjaxLinkSend(visitMonsterLink.arlink);
                };

                this.caapTopObject.find("span[id*='caap_monster_']").unbind('click', handler).click(handler);

                handler = function (e) {
                    utility.log(9, "Clicked", e.target.id);
                    var monsterRemove = {
                        mname     : '',
                        rlink     : '',
                        arlink    : ''
                    },
                    i = 0,
                    len = 0,
                    resp = false;

                    for (i = 0, len = e.target.attributes.length; i < len; i += 1) {
                        if (e.target.attributes[i].nodeName === 'mname') {
                            monsterRemove.mname = e.target.attributes[i].nodeValue;
                        } else if (e.target.attributes[i].nodeName === 'rlink') {
                            monsterRemove.rlink = e.target.attributes[i].nodeValue;
                            monsterRemove.arlink = monsterRemove.rlink.replace("http://apps.facebook.com/castle_age/", "");
                        }
                    }

                    utility.log(9, 'monsterRemove', monsterRemove);
                    resp = confirm("Are you sure you want to remove " + monsterRemove.mname + "?");
                    if (resp === true) {
                        monster.deleteItem(monsterRemove.mname);
                        caap.UpdateDashboard(true);
                        utility.ClickGetCachedAjax(monsterRemove.arlink);
                    }
                };

                this.caapTopObject.find("span[id*='caap_remove_']").unbind('click', handler).click(handler);
                state.setItem("MonsterDashUpdate", false);
            }

            /*-------------------------------------------------------------------------------------\
            Next we build the HTML to be included into the 'caap_guildMonster' div. We set our
            table and then build the header row.
            \-------------------------------------------------------------------------------------*/
            if (state.getItem("GuildMonsterDashUpdate", true)) {
                utility.log(3, "GuildMonsterDashUpdate");
                html = "<table width='100%' cellpadding='0px' cellspacing='0px'><tr>";
                headers = ['Slot', 'Name', 'Damage', 'Damage%',     'My Status', 'TimeLeft', 'Status', 'Link', '&nbsp;'];
                values  = ['slot', 'name', 'damage', 'enemyHealth', 'myStatus',  'ticker',   'state'];
                for (pp = 0; pp < headers.length; pp += 1) {
                    html += this.makeTh({text: headers[pp], color: '', id: '', title: '', width: ''});
                }

                html += '</tr>';
                for (i = 0, len = guild_monster.records.length; i < len; i += 1) {
                    html += "<tr>";
                    for (pp = 0; pp < values.length; pp += 1) {
                        switch (values[pp]) {
                        case 'name' :
                            data = {
                                text  : '<span id="caap_guildmonster_' + pp + '" title="Clicking this link will take you to (' + guild_monster.records[i].slot + ') ' + guild_monster.records[i].name +
                                        '" mname="' + guild_monster.records[i].slot + '" rlink="guild_battle_monster.php?twt2=' + guild_monster.records[i].name.replace(/ /g, '_') + '&guild_id=' + guild_monster.records[i].guildId +
                                        '&slot=' + guild_monster.records[i].slot + '" onmouseover="this.style.cursor=\'pointer\';" onmouseout="this.style.cursor=\'default\';">' + guild_monster.records[i].name + '</span>',
                                color : guild_monster.records[i].color,
                                id    : '',
                                title : ''
                            };

                            html += caap.makeTd(data);
                            break;
                        case 'damage' :
                            if (guild_monster.records[i][values[pp]]) {
                                html += caap.makeTd({text: guild_monster.records[i][values[pp]], color: guild_monster.records[i].color, id: '', title: ''});
                            } else {
                                html += caap.makeTd({text: '', color: guild_monster.records[i].color, id: '', title: ''});
                            }

                            break;
                        case 'enemyHealth' :
                            if (guild_monster.records[i][values[pp]]) {
                                data = {
                                    text  : guild_monster.records[i][values[pp]].toFixed(2),
                                    color : guild_monster.records[i].color,
                                    id    : '',
                                    title : ''
                                };

                                html += caap.makeTd(data);
                            } else {
                                html += caap.makeTd({text: '', color: guild_monster.records[i].color, id: '', title: ''});
                            }

                            break;
                        case 'ticker' :
                            if (guild_monster.records[i][values[pp]]) {
                                data = {
                                    text  : guild_monster.records[i][values[pp]].match(/(\d+:\d+):\d+/)[1],
                                    color : guild_monster.records[i].color,
                                    id    : '',
                                    title : ''
                                };

                                html += caap.makeTd(data);
                            } else {
                                html += caap.makeTd({text: '', color: guild_monster.records[i].color, id: '', title: ''});
                            }

                            break;
                        default :
                            html += caap.makeTd({text: guild_monster.records[i][values[pp]], color: guild_monster.records[i].color, id: '', title: ''});
                        }
                    }

                    data = {
                        text  : '<a href="http://apps.facebook.com/castle_age/guild_battle_monster.php?twt2=' + guild_monster.records[i].name.replace(/ /g, '_') +
                                '&guild_id=' + guild_monster.records[i].guildId + '&action=doObjective&slot=' + guild_monster.records[i].slot + '&ref=nf">Link</a>',
                        color : 'blue',
                        id    : '',
                        title : 'This is a siege link.'
                    };

                    html += caap.makeTd(data);

                    if (guild_monster.records[i].conditions && guild_monster.records[i].conditions !== 'none') {
                        data = {
                            text  : '<span title="User Set Conditions: ' + guild_monster.records[i].conditions + '" class="ui-icon ui-icon-info">i</span>',
                            color : guild_monster.records[i].color,
                            id    : '',
                            title : ''
                        };

                        html += caap.makeTd(data);
                    } else {
                        html += caap.makeTd({text: '', color: color, id: '', title: ''});
                    }

                    html += '</tr>';
                }

                html += '</table>';
                this.caapTopObject.find("#caap_guildMonster").html(html);

                handler = function (e) {
                    utility.log(9, "Clicked", e.target.id);
                    var visitMonsterLink = {
                        mname     : '',
                        arlink    : ''
                    },
                    i = 0,
                    len = 0;

                    for (i = 0, len = e.target.attributes.length; i < len; i += 1) {
                        if (e.target.attributes[i].nodeName === 'mname') {
                            visitMonsterLink.mname = e.target.attributes[i].nodeValue;
                        } else if (e.target.attributes[i].nodeName === 'rlink') {
                            visitMonsterLink.arlink = e.target.attributes[i].nodeValue;
                        }
                    }

                    utility.log(9, 'visitMonsterLink', visitMonsterLink);
                    utility.ClickAjaxLinkSend(visitMonsterLink.arlink);
                };

                this.caapTopObject.find("span[id*='caap_guildmonster_']").unbind('click', handler).click(handler);

                state.setItem("GuildMonsterDashUpdate", false);
            }

            /*-------------------------------------------------------------------------------------\
            Next we build the HTML to be included into the 'caap_infoTargets1' div. We set our
            table and then build the header row.
            \-------------------------------------------------------------------------------------*/
            if (state.getItem("ReconDashUpdate", true)) {
                html = "<table width='100%' cellpadding='0px' cellspacing='0px'><tr>";
                headers = ['UserId', 'Name',    'Deity#',   'Rank',    'Rank#',   'Level',    'Army',    'Last Alive'];
                values  = ['userID', 'nameStr', 'deityNum', 'rankStr', 'rankNum', 'levelNum', 'armyNum', 'aliveTime'];
                for (pp = 0; pp < headers.length; pp += 1) {
                    html += this.makeTh({text: headers[pp], color: '', id: '', title: '', width: ''});
                }

                html += '</tr>';
                for (i = 0, len = this.ReconRecordArray.length; i < len; i += 1) {
                    html += "<tr>";
                    for (pp = 0; pp < values.length; pp += 1) {
                        if (/userID/.test(values[pp])) {
                            userIdLinkInstructions = "Clicking this link will take you to the user keep of " + this.ReconRecordArray[i][values[pp]];
                            userIdLink = "http://apps.facebook.com/castle_age/keep.php?casuser=" + this.ReconRecordArray[i][values[pp]];
                            data = {
                                text  : '<span id="caap_targetrecon_' + i + '" title="' + userIdLinkInstructions + '" rlink="' + userIdLink +
                                        '" onmouseover="this.style.cursor=\'pointer\';" onmouseout="this.style.cursor=\'default\';">' + this.ReconRecordArray[i][values[pp]] + '</span>',
                                color : 'blue',
                                id    : '',
                                title : ''
                            };

                            html += caap.makeTd(data);
                        } else if (/\S+Num/.test(values[pp])) {
                            html += caap.makeTd({text: this.ReconRecordArray[i][values[pp]], color: 'black', id: '', title: ''});
                        } else if (/\S+Time/.test(values[pp])) {
                            newTime = new Date(this.ReconRecordArray[i][values[pp]]);
                            data = {
                                text  : newTime.getDate() + '-' + shortMonths[newTime.getMonth()] + ' ' + newTime.getHours() + ':' + (newTime.getMinutes() < 10 ? '0' : '') + newTime.getMinutes(),
                                color : 'black',
                                id    : '',
                                title : ''
                            };

                            html += caap.makeTd(data);
                        } else {
                            html += caap.makeTd({text: this.ReconRecordArray[i][values[pp]], color: 'black', id: '', title: ''});
                        }
                    }

                    html += '</tr>';
                }

                html += '</table>';
                this.caapTopObject.find("#caap_infoTargets1").html(html);

                handler = function (e) {
                    utility.log(9, "Clicked", e.target.id);
                    var visitUserIdLink = {
                        rlink     : '',
                        arlink    : ''
                    },
                    i = 0,
                    len = 0;

                    for (i = 0, len = e.target.attributes.length; i < len; i += 1) {
                        if (e.target.attributes[i].nodeName === 'rlink') {
                            visitUserIdLink.rlink = e.target.attributes[i].nodeValue;
                            visitUserIdLink.arlink = visitUserIdLink.rlink.replace("http://apps.facebook.com/castle_age/", "");
                        }
                    }

                    utility.log(9, 'visitUserIdLink', visitUserIdLink);
                    utility.ClickAjaxLinkSend(visitUserIdLink.arlink);
                };

                this.caapTopObject.find("span[id*='caap_targetrecon_']").unbind('click', handler).click(handler);
                state.setItem("ReconDashUpdate", false);
            }

            /*-------------------------------------------------------------------------------------\
            Next we build the HTML to be included into the 'caap_infoBattle' div. We set our
            table and then build the header row.
            \-------------------------------------------------------------------------------------*/
            if (state.getItem("BattleDashUpdate", true)) {
                html = "<table width='100%' cellpadding='0px' cellspacing='0px'><tr>";
                headers = ['UserId', 'Name',    'BR#',     'WR#',        'Level',    'Army',    'I Win',         'I Lose',          'D Win',       'D Lose',        'W Win',      'W Lose'];
                values  = ['userId', 'nameStr', 'rankNum', 'warRankNum', 'levelNum', 'armyNum', 'invadewinsNum', 'invadelossesNum', 'duelwinsNum', 'duellossesNum', 'warwinsNum', 'warlossesNum'];
                for (pp = 0; pp < headers.length; pp += 1) {
                    html += this.makeTh({text: headers[pp], color: '', id: '', title: '', width: ''});
                }

                html += '</tr>';
                for (i = 0, len = battle.records.length; i < len; i += 1) {
                    html += "<tr>";
                    for (pp = 0, len1 = values.length; pp < len1; pp += 1) {
                        if (/userId/.test(values[pp])) {
                            userIdLinkInstructions = "Clicking this link will take you to the user keep of " + battle.records[i][values[pp]];
                            userIdLink = "http://apps.facebook.com/castle_age/keep.php?casuser=" + battle.records[i][values[pp]];
                            data = {
                                text  : '<span id="caap_battle_' + i + '" title="' + userIdLinkInstructions + '" rlink="' + userIdLink +
                                        '" onmouseover="this.style.cursor=\'pointer\';" onmouseout="this.style.cursor=\'default\';">' + battle.records[i][values[pp]] + '</span>',
                                color : 'blue',
                                id    : '',
                                title : ''
                            };

                            html += caap.makeTd(data);
                        } else if (/rankNum/.test(values[pp])) {
                            html += caap.makeTd({text: battle.records[i][values[pp]], color: 'black', id: '', title: battle.records[i].rankStr});
                        } else if (/warRankNum/.test(values[pp])) {
                            html += caap.makeTd({text: battle.records[i][values[pp]], color: 'black', id: '', title: battle.records[i].warRankStr});
                        } else {
                            html += caap.makeTd({text: battle.records[i][values[pp]], color: 'black', id: '', title: ''});
                        }
                    }

                    html += '</tr>';
                }

                html += '</table>';
                this.caapTopObject.find("#caap_infoBattle").html(html);

                this.caapTopObject.find("span[id*='caap_battle_']").click(function (e) {
                    utility.log(9, "Clicked", e.target.id);
                    var visitUserIdLink = {
                        rlink     : '',
                        arlink    : ''
                    },
                    i = 0,
                    len = 0;

                    for (i = 0, len = e.target.attributes.length; i < len; i += 1) {
                        if (e.target.attributes[i].nodeName === 'rlink') {
                            visitUserIdLink.rlink = e.target.attributes[i].nodeValue;
                            visitUserIdLink.arlink = visitUserIdLink.rlink.replace("http://apps.facebook.com/castle_age/", "");
                        }
                    }

                    utility.log(9, 'visitUserIdLink', visitUserIdLink);
                    utility.ClickAjaxLinkSend(visitUserIdLink.arlink);
                });

                state.setItem("BattleDashUpdate", false);
            }

            /*-------------------------------------------------------------------------------------\
            Next we build the HTML to be included into the 'caap_userStats' div. We set our
            table and then build the header row.
            \-------------------------------------------------------------------------------------*/
            if (state.getItem("UserDashUpdate", true)) {
                html = "<table width='100%' cellpadding='0px' cellspacing='0px'><tr>";
                headers = ['Name', 'Value', 'Name', 'Value'];
                for (pp = 0, len = headers.length; pp < len; pp += 1) {
                    html += this.makeTh({text: headers[pp], color: '', id: '', title: '', width: ''});
                }

                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Facebook ID', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.stats.FBID, color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Account Name', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.stats.account, color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Character Name', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.stats.PlayerName, color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Energy', color: titleCol, id: '', title: 'Current/Max'});
                html += this.makeTd({text: this.stats.energy.num + '/' + this.stats.energy.max, color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Level', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.stats.level, color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Stamina', color: titleCol, id: '', title: 'Current/Max'});
                html += this.makeTd({text: this.stats.stamina.num + '/' + this.stats.stamina.max, color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Battle Rank', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: battle.battleRankTable[this.stats.rank.battle] + ' (' + this.stats.rank.battle + ')', color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Attack', color: titleCol, id: '', title: 'Current/Max'});
                html += this.makeTd({text: this.makeCommaValue(this.stats.attack), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Battle Rank Points', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.rank.battlePoints), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Defense', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.defense), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'War Rank', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: battle.warRankTable[this.stats.rank.war] + ' (' + this.stats.rank.war + ')', color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Health', color: titleCol, id: '', title: 'Current/Max'});
                html += this.makeTd({text: this.stats.health.num + '/' + this.stats.health.max, color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'War Rank Points', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.rank.warPoints), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Army', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.army.actual), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Generals', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.stats.generals.total, color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Generals When Invade', color: titleCol, id: '', title: 'For every 5 army members you have, one of your generals will also join the fight.'});
                html += this.makeTd({text: this.stats.generals.invade, color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Gold In Bank', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '$' + this.makeCommaValue(this.stats.gold.bank), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Total Income Per Hour', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '$' + this.makeCommaValue(this.stats.gold.income), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Gold In Cash', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '$' + this.makeCommaValue(this.stats.gold.cash), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Upkeep', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '$' + this.makeCommaValue(this.stats.gold.upkeep), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Total Gold', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '$' + this.makeCommaValue(this.stats.gold.total), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Cash Flow Per Hour', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '$' + this.makeCommaValue(this.stats.gold.flow), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Skill Points', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.stats.points.skill, color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Energy Potions', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.stats.potions.energy, color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Favor Points', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.stats.points.favor, color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Stamina Potions', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.stats.potions.stamina, color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Experience To Next Level (ETNL)', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.exp.dif), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Battle Strength Index (BSI)', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.stats.indicators.bsi.toFixed(2), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Hours To Level (HTL)', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.decHours2HoursMin(this.stats.indicators.htl), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Levelling Speed Index (LSI)', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.stats.indicators.lsi.toFixed(2), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Hours Remaining To Level (HRTL)', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.decHours2HoursMin(this.stats.indicators.hrtl), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Skill Points Per Level (SPPL)', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.stats.indicators.sppl.toFixed(2), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Expected Next Level (ENL)', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: schedule.FormatTime(new Date(this.stats.indicators.enl)), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Attack Power Index (API)', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.stats.indicators.api.toFixed(2), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Defense Power Index (DPI)', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.stats.indicators.dpi.toFixed(2), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Mean Power Index (MPI)', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.stats.indicators.mpi.toFixed(2), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Battles/Wars Won', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.other.bww), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Times eliminated', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.other.te), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Battles/Wars Lost', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.other.bwl), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Times you eliminated an enemy', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.other.tee), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Battles/Wars Win/Loss Ratio (WLR)', color: titleCol, id: '', title: ''});
                if (this.stats.other.wlr) {
                    html += this.makeTd({text: this.stats.other.wlr.toFixed(2), color: valueCol, id: '', title: ''});
                } else {
                    html += this.makeTd({text: this.stats.other.wlr, color: valueCol, id: '', title: ''});
                }

                html += this.makeTd({text: 'Enemy Eliminated/Eliminated Ratio (EER)', color: titleCol, id: '', title: ''});
                if (this.stats.other.eer) {
                    html += this.makeTd({text: this.stats.other.eer.toFixed(2), color: valueCol, id: '', title: ''});
                } else {
                    html += this.makeTd({text: this.stats.other.eer, color: valueCol, id: '', title: ''});
                }

                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Invasions Won', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.achievements.battle.invasions.won), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Duels Won', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.achievements.battle.duels.won), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Invasions Lost', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.achievements.battle.invasions.lost), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Duels Lost', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.achievements.battle.duels.lost), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Invasions Streak', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.achievements.battle.invasions.streak), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Duels Streak', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.achievements.battle.duels.streak), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Invasions Win/loss Ratio (IWLR)', color: titleCol, id: '', title: ''});
                if (this.stats.achievements.battle.invasions.ratio) {
                    html += this.makeTd({text: this.stats.achievements.battle.invasions.ratio.toFixed(2), color: valueCol, id: '', title: ''});
                } else {
                    html += this.makeTd({text: this.stats.achievements.battle.invasions.ratio, color: valueCol, id: '', title: ''});
                }

                html += this.makeTd({text: 'Duels Win/loss Ratio (DWLR)', color: titleCol, id: '', title: ''});
                if (this.stats.achievements.battle.duels.ratio) {
                    html += this.makeTd({text: this.stats.achievements.battle.duels.ratio.toFixed(2), color: valueCol, id: '', title: ''});
                } else {
                    html += this.makeTd({text: this.stats.achievements.battle.duels.ratio, color: valueCol, id: '', title: ''});
                }

                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Quests Completed', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.other.qc), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Alchemy Performed', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.achievements.other.alchemy), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Gildamesh, The Orc King Slain', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.achievements.monster.gildamesh), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Lotus Ravenmoore Slain', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.achievements.monster.lotus), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'The Colossus of Terra Slain', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.achievements.monster.colossus), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Dragons Slain', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.achievements.monster.dragons), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Sylvanas the Sorceress Queen Slain', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.achievements.monster.sylvanas), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Cronus, The World Hydra Slain', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.achievements.monster.cronus), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Keira the Dread Knight Slain', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.achievements.monster.keira), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'The Battle of the Dark Legion Slain', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.achievements.monster.legion), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Genesis, The Earth Elemental Slain', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.achievements.monster.genesis), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Skaar Deathrune Slain', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.achievements.monster.skaar), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Gehenna, The Fire Elemental Slain', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.achievements.monster.gehenna), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Sieges Assisted With', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.achievements.monster.sieges), color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: "Aurelius, Lion's Rebellion", color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.makeCommaValue(this.stats.achievements.monster.aurelius), color: valueCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Ambrosia Daily Points', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.demi.ambrosia.daily.num + '/' + this.demi.ambrosia.daily.max, color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Malekus Daily Points', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.demi.malekus.daily.num + '/' + this.demi.ambrosia.daily.max, color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Ambrosia Total Points', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.demi.ambrosia.power.total, color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Malekus Total Points', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.demi.malekus.power.total, color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Corvintheus Daily Points', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.demi.corvintheus.daily.num + '/' + this.demi.corvintheus.daily.max, color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Aurora Daily Points', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.demi.aurora.daily.num + '/' + this.demi.aurora.daily.max, color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Corvintheus Total Points', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.demi.corvintheus.power.total, color: valueCol, id: '', title: ''});
                html += this.makeTd({text: 'Aurora Total Points', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.demi.aurora.power.total, color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Azeron Daily Points', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.demi.azeron.daily.num + '/' + this.demi.azeron.daily.max, color: valueCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: 'Azeron Total Points', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: this.demi.azeron.power.total, color: valueCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += '</tr>';

                html += "<tr>";
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: titleCol, id: '', title: ''});
                html += this.makeTd({text: '&nbsp;', color: valueCol, id: '', title: ''});
                html += '</tr>';

                count = 0;
                for (pp in this.stats.character) {
                    if (this.stats.character.hasOwnProperty(pp)) {
                        if (count % 2  === 0) {
                            html += "<tr>";
                        }

                        html += this.makeTd({text: this.stats.character[pp].name, color: titleCol, id: '', title: ''});
                        html += this.makeTd({text: "Level " + this.stats.character[pp].level + " (" + this.stats.character[pp].percent + "%)", color: valueCol, id: '', title: ''});
                        if (count % 2 === 1) {
                            html += '</tr>';
                        }

                        count += 1;
                    }
                }

                html += '</table>';
                this.caapTopObject.find("#caap_userStats").html(html);
                state.setItem("UserDashUpdate", false);
            }

            /*-------------------------------------------------------------------------------------\
            Next we build the HTML to be included into the 'caap_generalsStats' div. We set our
            table and then build the header row.
            \-------------------------------------------------------------------------------------*/
            if (state.getItem("GeneralsDashUpdate", true)) {
                html = "<table width='100%' cellpadding='0px' cellspacing='0px'><tr>";
                headers = ['General', 'Lvl', 'Atk', 'Def', 'API', 'DPI', 'MPI', 'EAtk', 'EDef', 'EAPI', 'EDPI', 'EMPI', 'Special'];
                values  = ['name', 'lvl', 'atk', 'def', 'api', 'dpi', 'mpi', 'eatk', 'edef', 'eapi', 'edpi', 'empi', 'special'];
                $.merge(generalValues, values);
                for (pp = 0, len = headers.length; pp < len; pp += 1) {
                    header = {
                        text  : '<span id="caap_generalsStats_' + values[pp] + '" title="Click to sort" onmouseover="this.style.cursor=\'pointer\';" onmouseout="this.style.cursor=\'default\';">' + headers[pp] + '</span>',
                        color : 'blue',
                        id    : '',
                        title : '',
                        width : ''
                    };

                    if (headers[pp] === 'Special') {
                        header = {
                            text  : headers[pp],
                            color : 'black',
                            id    : '',
                            title : '',
                            width : '25%'
                        };
                    }

                    html += this.makeTh(header);
                }

                html += '</tr>';
                for (it = 0, len = general.recordsSortable.length; it < len; it += 1) {
                    html += "<tr>";
                    for (pp = 0, len1 = values.length; pp < len; pp += 1) {
                        str = '';
                        if (isNaN(general.recordsSortable[it][values[pp]])) {
                            if (general.recordsSortable[it][values[pp]]) {
                                str = general.recordsSortable[it][values[pp]];
                            }
                        } else {
                            if (/pi/.test(values[pp])) {
                                str = general.recordsSortable[it][values[pp]].toFixed(2);
                            } else {
                                str = general.recordsSortable[it][values[pp]].toString();
                            }
                        }

                        if (pp === 0) {
                            color = titleCol;
                        } else {
                            color = valueCol;
                        }

                        html += caap.makeTd({text: str, color: color, id: '', title: ''});
                    }

                    html += '</tr>';
                }

                html += '</table>';
                this.caapTopObject.find("#caap_generalsStats").html(html);

                handler = function (e) {
                    var clicked = '';

                    if (e.target.id) {
                        clicked = e.target.id.replace(statsRegExp, '');
                    }

                    utility.log(9, "Clicked", clicked);
                    if (generalValues.indexOf(clicked) !== -1) {
                        general.recordsSortable.sort(sort.by(clicked, sort.by('name')));
                        state.setItem("GeneralsDashUpdate", true);
                        caap.UpdateDashboard(true);
                    }
                };

                this.caapTopObject.find("span[id*='caap_generalsStats_']").unbind('click', handler).click(handler);
                state.setItem("GeneralsDashUpdate", false);
            }


            /*-------------------------------------------------------------------------------------\
            Next we build the HTML to be included into the 'soldiers', 'item' and 'magic' div.
            We set our table and then build the header row.
            \-------------------------------------------------------------------------------------*/
            if (state.getItem("SoldiersDashUpdate", true) || state.getItem("ItemDashUpdate", true) || state.getItem("MagicDashUpdate", true)) {
                headers = ['Name', 'Type', 'Owned', 'Atk', 'Def', 'API', 'DPI', 'MPI', 'Cost', 'Upkeep', 'Hourly'];
                values  = ['name', 'type', 'owned', 'atk', 'def', 'api', 'dpi', 'mpi', 'cost', 'upkeep', 'hourly'];
                $.merge(townValues, values);
                for (i = 0, len = town.types.length; i < len; i += 1) {
                    if (!state.getItem(town.types[i].ucFirst() + "DashUpdate", true)) {
                        continue;
                    }

                    html = "<table width='100%' cellpadding='0px' cellspacing='0px'><tr>";
                    for (pp = 0, len1 = headers.length; pp < len1; pp += 1) {
                        if (town.types[i] !== 'item' && headers[pp] === 'Type') {
                            continue;
                        }

                        header = {
                            text  : '<span id="caap_' + town.types[i] + 'Stats_' + values[pp] + '" title="Click to sort" onmouseover="this.style.cursor=\'pointer\';" onmouseout="this.style.cursor=\'default\';">' + headers[pp] + '</span>',
                            color : 'blue',
                            id    : '',
                            title : '',
                            width : ''
                        };

                        html += this.makeTh(header);
                    }

                    html += '</tr>';
                    for (it = 0, len1 = town[town.types[i] + "Sortable"].length; it < len1; it += 1) {
                        html += "<tr>";
                        for (pp = 0, len2 = values.length; pp < len2; pp += 1) {
                            if (town.types[i] !== 'item' && values[pp] === 'type') {
                                continue;
                            }

                            str = '';
                            if (isNaN(town[town.types[i] + "Sortable"][it][values[pp]])) {
                                if (town[town.types[i] + "Sortable"][it][values[pp]]) {
                                    str = town[town.types[i] + "Sortable"][it][values[pp]];
                                }
                            } else {
                                if (/pi/.test(values[pp])) {
                                    str = town[town.types[i] + "Sortable"][it][values[pp]].toFixed(2);
                                } else {
                                    str = this.makeCommaValue(town[town.types[i] + "Sortable"][it][values[pp]]);
                                    if (values[pp] === 'cost' || values[pp] === 'upkeep' || values[pp] === 'hourly') {
                                        str = "$" + str;
                                    }
                                }
                            }

                            if (pp === 0) {
                                color = titleCol;
                            } else {
                                color = valueCol;
                            }

                            html += caap.makeTd({text: str, color: color, id: '', title: ''});
                        }

                        html += '</tr>';
                    }

                    html += '</table>';
                    this.caapTopObject.find("#caap_" + town.types[i] + "Stats").html(html);
                }

                handler = function (e) {
                    var clicked = '';

                    if (e.target.id) {
                        clicked = e.target.id.replace(statsRegExp, '');
                    }

                    utility.log(9, "Clicked", clicked);
                    if (townValues.indexOf(clicked) !== -1) {
                        town.soldiersSortable.sort(sort.by(clicked, sort.by('name')));
                        state.setItem("SoldiersDashUpdate", true);
                        caap.UpdateDashboard(true);
                    }
                };

                this.caapTopObject.find("span[id*='caap_soldiersStats_']").unbind('click', handler).click(handler);
                state.setItem("SoldiersDashUpdate", false);

                handler = function (e) {
                    var clicked = '';

                    if (e.target.id) {
                        clicked = e.target.id.replace(statsRegExp, '');
                    }

                    utility.log(9, "Clicked", clicked);
                    if (townValues.indexOf(clicked) !== -1) {
                        town.itemSortable.sort(sort.by(clicked, sort.by('name')));
                        state.setItem("ItemDashUpdate", true);
                        caap.UpdateDashboard(true);
                    }
                };

                this.caapTopObject.find("span[id*='caap_itemStats_']").unbind('click', handler).click(handler);
                state.setItem("ItemDashUpdate", false);

                handler = function (e) {
                    var clicked = '';

                    if (e.target.id) {
                        clicked = e.target.id.replace(statsRegExp, '');
                    }

                    utility.log(9, "Clicked", clicked);
                    if (townValues.indexOf(clicked) !== -1) {
                        town.magicSortable.sort(sort.by(clicked, sort.by('name')));
                        state.setItem("MagicDashUpdate", true);
                        caap.UpdateDashboard(true);
                    }
                };

                this.caapTopObject.find("span[id*='caap_magicStats_']").unbind('click', handler).click(handler);
                state.setItem("MagicDashUpdate", false);
            }

            /*-------------------------------------------------------------------------------------\
            Next we build the HTML to be included into the 'caap_giftStats' div. We set our
            table and then build the header row.
            \-------------------------------------------------------------------------------------*/
            if (state.getItem("GiftHistoryDashUpdate", true)) {
                html = "<table width='100%' cellpadding='0px' cellspacing='0px'><tr>";
                headers = ['UserId', 'Name', 'Received', 'Sent'];
                values  = ['userId', 'name', 'received', 'sent'];
                for (pp = 0, len = headers.length; pp < len; pp += 1) {
                    html += this.makeTh({text: headers[pp], color: '', id: '', title: '', width: ''});
                }

                html += '</tr>';
                for (i = 0, len = gifting.history.records.length; i < len; i += 1) {
                    html += "<tr>";
                    for (pp = 0, len1 = values.length; pp < len1; pp += 1) {
                        if (/userId/.test(values[pp])) {
                            userIdLinkInstructions = "Clicking this link will take you to the user keep of " + gifting.history.records[i][values[pp]];
                            userIdLink = "http://apps.facebook.com/castle_age/keep.php?casuser=" + gifting.history.records[i][values[pp]];
                            data = {
                                text  : '<span id="caap_targetgift_' + i + '" title="' + userIdLinkInstructions + '" rlink="' + userIdLink +
                                        '" onmouseover="this.style.cursor=\'pointer\';" onmouseout="this.style.cursor=\'default\';">' + gifting.history.records[i][values[pp]] + '</span>',
                                color : 'blue',
                                id    : '',
                                title : ''
                            };

                            html += caap.makeTd(data);
                        } else {
                            html += caap.makeTd({text: gifting.history.records[i][values[pp]], color: 'black', id: '', title: ''});
                        }
                    }

                    html += '</tr>';
                }

                html += '</table>';
                this.caapTopObject.find("#caap_giftStats").html(html);

                handler = function (e) {
                    utility.log(9, "Clicked", e.target.id);
                    var visitUserIdLink = {
                        rlink     : '',
                        arlink    : ''
                    },
                    i = 0,
                    len = 0;

                    for (i = 0, len = e.target.attributes.length; i < len; i += 1) {
                        if (e.target.attributes[i].nodeName === 'rlink') {
                            visitUserIdLink.rlink = e.target.attributes[i].nodeValue;
                            visitUserIdLink.arlink = visitUserIdLink.rlink.replace("http://apps.facebook.com/castle_age/", "");
                        }
                    }

                    utility.log(9, 'visitUserIdLink', visitUserIdLink);
                    utility.ClickAjaxLinkSend(visitUserIdLink.arlink);
                };

                this.caapTopObject.find("span[id*='caap_targetgift_']").unbind('click', handler).click(handler);
                state.setItem("GiftHistoryDashUpdate", false);
            }

            /*-------------------------------------------------------------------------------------\
            Next we build the HTML to be included into the 'caap_giftQueue' div. We set our
            table and then build the header row.
            \-------------------------------------------------------------------------------------*/
            if (state.getItem("GiftQueueDashUpdate", true)) {
                html = "<table width='100%' cellpadding='0px' cellspacing='0px'><tr>";
                headers = ['UserId', 'Name', 'Gift', 'FB Cleared', 'Delete'];
                values  = ['userId', 'name', 'gift', 'found'];
                for (pp = 0, len = headers.length; pp < len; pp += 1) {
                    html += this.makeTh({text: headers[pp], color: '', id: '', title: '', width: ''});
                }

                html += '</tr>';
                for (i = 0, len = gifting.queue.records.length; i < len; i += 1) {
                    html += "<tr>";
                    for (pp = 0, len1 = values.length; pp < len1; pp += 1) {
                        if (/userId/.test(values[pp])) {
                            userIdLinkInstructions = "Clicking this link will take you to the user keep of " + gifting.queue.records[i][values[pp]];
                            userIdLink = "http://apps.facebook.com/castle_age/keep.php?casuser=" + gifting.queue.records[i][values[pp]];
                            data = {
                                text  : '<span id="caap_targetgiftq_' + i + '" title="' + userIdLinkInstructions + '" rlink="' + userIdLink +
                                        '" onmouseover="this.style.cursor=\'pointer\';" onmouseout="this.style.cursor=\'default\';">' + gifting.queue.records[i][values[pp]] + '</span>',
                                color : 'blue',
                                id    : '',
                                title : ''
                            };

                            html += caap.makeTd(data);
                        } else {
                            html += caap.makeTd({text: gifting.queue.records[i][values[pp]], color: 'black', id: '', title: ''});
                        }
                    }

                    removeLinkInstructions = "Clicking this link will remove " + gifting.queue.records[i].name + "'s entry from the gift queue!";
                    data = {
                        text  : '<span id="caap_removeq_' + i + '" title="' + removeLinkInstructions + '" mname="' +
                                '" onmouseover="this.style.cursor=\'pointer\';" onmouseout="this.style.cursor=\'default\';" class="ui-icon ui-icon-circle-close">X</span>',
                        color : 'blue',
                        id    : '',
                        title : ''
                    };

                    html += caap.makeTd(data);

                    html += '</tr>';
                }

                html += '</table>';
                this.caapTopObject.find("#caap_giftQueue").html(html);

                handler = function (e) {
                    utility.log(9, "Clicked", e.target.id);
                    var visitUserIdLink = {
                        rlink     : '',
                        arlink    : ''
                    },
                    i = 0,
                    len = 0;

                    for (i = 0, len = e.target.attributes.length; i < len; i += 1) {
                        if (e.target.attributes[i].nodeName === 'rlink') {
                            visitUserIdLink.rlink = e.target.attributes[i].nodeValue;
                            visitUserIdLink.arlink = visitUserIdLink.rlink.replace("http://apps.facebook.com/castle_age/", "");
                        }
                    }

                    utility.log(9, 'visitUserIdLink', visitUserIdLink);
                    utility.ClickAjaxLinkSend(visitUserIdLink.arlink);
                };

                this.caapTopObject.find("span[id*='caap_targetgiftq_']").unbind('click', handler).click(handler);

                handler = function (e) {
                    utility.log(9, "Clicked", e.target.id);
                    var index = -1,
                        i = 0,
                        len = 0,
                        resp = false;

                    for (i = 0, len = e.target.attributes.length; i < len; i += 1) {
                        if (e.target.attributes[i].nodeName === 'id') {
                            index = parseInt(e.target.attributes[i].nodeValue.replace("caap_removeq_", ""), 10);
                        }
                    }

                    utility.log(9, 'index', index);
                    resp = confirm("Are you sure you want to remove this queue entry?");
                    if (resp === true) {
                        gifting.queue.deleteIndex(index);
                        caap.UpdateDashboard(true);
                    }
                };

                this.caapTopObject.find("span[id*='caap_removeq_']").unbind('click', handler).click(handler);
                state.setItem("GiftQueueDashUpdate", false);
            }

            return true;
        } catch (err) {
            utility.error("ERROR in UpdateDashboard: " + err);
            return false;
        }
    },

    /*-------------------------------------------------------------------------------------\
    AddDBListener creates the listener for our dashboard controls.
    \-------------------------------------------------------------------------------------*/
    dbDisplayListener: function (e) {
        var value = e.target.options[e.target.selectedIndex].value;
        config.setItem('DBDisplay', value);
        caap.SetDisplay("caapTopObject", 'infoMonster', false);
        caap.SetDisplay("caapTopObject", 'guildMonster', false);
        caap.SetDisplay("caapTopObject", 'infoTargets1', false);
        caap.SetDisplay("caapTopObject", 'infoBattle', false);
        caap.SetDisplay("caapTopObject", 'userStats', false);
        caap.SetDisplay("caapTopObject", 'generalsStats', false);
        caap.SetDisplay("caapTopObject", 'soldiersStats', false);
        caap.SetDisplay("caapTopObject", 'itemStats', false);
        caap.SetDisplay("caapTopObject", 'magicStats', false);
        caap.SetDisplay("caapTopObject", 'giftStats', false);
        caap.SetDisplay("caapTopObject", 'giftQueue', false);
        caap.SetDisplay("caapTopObject", 'buttonMonster', false);
        caap.SetDisplay("caapTopObject", 'buttonGuildMonster', false);
        caap.SetDisplay("caapTopObject", 'buttonTargets', false);
        caap.SetDisplay("caapTopObject", 'buttonBattle', false);
        caap.SetDisplay("caapTopObject", 'buttonGifting', false);
        caap.SetDisplay("caapTopObject", 'buttonGiftQueue', false);
        switch (value) {
        case "Target List" :
            caap.SetDisplay("caapTopObject", 'infoTargets1', true);
            caap.SetDisplay("caapTopObject", 'buttonTargets', true);
            break;
        case "Battle Stats" :
            caap.SetDisplay("caapTopObject", 'infoBattle', true);
            caap.SetDisplay("caapTopObject", 'buttonBattle', true);
            break;
        case "User Stats" :
            caap.SetDisplay("caapTopObject", 'userStats', true);
            break;
        case "Generals Stats" :
            caap.SetDisplay("caapTopObject", 'generalsStats', true);
            break;
        case "Soldier Stats" :
            caap.SetDisplay("caapTopObject", 'soldiersStats', true);
            break;
        case "Item Stats" :
            caap.SetDisplay("caapTopObject", 'itemStats', true);
            break;
        case "Magic Stats" :
            caap.SetDisplay("caapTopObject", 'magicStats', true);
            break;
        case "Gifting Stats" :
            caap.SetDisplay("caapTopObject", 'giftStats', true);
            caap.SetDisplay("caapTopObject", 'buttonGifting', true);
            break;
        case "Gift Queue" :
            caap.SetDisplay("caapTopObject", 'giftQueue', true);
            caap.SetDisplay("caapTopObject", 'buttonGiftQueue', true);
            break;
        case "Guild Monster" :
            caap.SetDisplay("caapTopObject", 'guildMonster', true);
            caap.SetDisplay("caapTopObject", 'buttonGuildMonster', true);
            break;
        case "Monster" :
            caap.SetDisplay("caapTopObject", 'infoMonster', true);
            caap.SetDisplay("caapTopObject", 'buttonMonster', true);
            break;
        default :
        }
    },

    refreshMonstersListener: function (e) {
        monster.flagFullReview();
    },

    refreshGuildMonstersListener: function (e) {
        utility.log(1, "refreshGuildMonstersListener");
        state.setItem('ReleaseControl', true);
        guild_monster.clear();
        caap.UpdateDashboard(true);
        schedule.setItem("guildMonsterReview", 0);
    },

    liveFeedButtonListener: function (e) {
        utility.ClickAjaxLinkSend('army_news_feed.php');
    },

    clearTargetsButtonListener: function (e) {
        caap.ReconRecordArray = [];
        caap.SaveRecon();
        caap.UpdateDashboard(true);
    },

    clearBattleButtonListener: function (e) {
        battle.clear();
        caap.UpdateDashboard(true);
    },

    clearGiftingButtonListener: function (e) {
        gifting.clear("history");
        caap.UpdateDashboard(true);
    },

    clearGiftQueueButtonListener: function (e) {
        gifting.clear("queue");
        caap.UpdateDashboard(true);
    },

    AddDBListener: function () {
        try {
            utility.log(3, "Adding listeners for caap_top");
            if (!caap.caapTopObject.find('#caap_DBDisplay').length) {
                caap.ReloadCastleAge();
            }

            caap.caapTopObject.find('#caap_DBDisplay').change(this.dbDisplayListener);
            caap.caapTopObject.find('#caap_refreshMonsters').click(this.refreshMonstersListener);
            caap.caapTopObject.find('#caap_refreshGuildMonsters').click(this.refreshGuildMonstersListener);
            caap.caapTopObject.find('#caap_liveFeed').click(this.liveFeedButtonListener);
            caap.caapTopObject.find('#caap_clearTargets').click(this.clearTargetsButtonListener);
            caap.caapTopObject.find('#caap_clearBattle').click(this.clearBattleButtonListener);
            caap.caapTopObject.find('#caap_clearGifting').click(this.clearGiftingButtonListener);
            caap.caapTopObject.find('#caap_clearGiftQueue').click(this.clearGiftQueueButtonListener);
            utility.log(8, "Listeners added for caap_top");
            return true;
        } catch (err) {
            utility.error("ERROR in AddDBListener: " + err);
            return false;
        }
    },

    /////////////////////////////////////////////////////////////////////
    //                          EVENT LISTENERS
    // Watch for changes and update the controls
    /////////////////////////////////////////////////////////////////////

    SetDisplay: function (area, idName, setting) {
        try {
            if (!this[area]) {
                utility.warn("area", area);
                throw "No such area!";
            }

            if (setting === true) {
                this[area].find('#caap_' + idName).css('display', 'block');
            } else {
                this[area].find('#caap_' + idName).css('display', 'none');
            }

            return true;
        } catch (err) {
            utility.error("ERROR in SetDisplay: " + err);
            return false;
        }
    },

    CheckBoxListener: function (e) {
        try {
            var idName        = e.target.id.replace(/caap_/i, ''),
                DocumentTitle = '',
                d             = '',
                styleXY       = {};

            utility.log(1, "Change: setting '" + idName + "' to ", e.target.checked);
            config.setItem(idName, e.target.checked);
            if (e.target.className) {
                caap.SetDisplay("caapDivObject", e.target.className, e.target.checked);
            }

            switch (idName) {
            case "AutoStatAdv" :
                utility.log(9, "AutoStatAdv");
                if (e.target.checked) {
                    caap.SetDisplay("caapDivObject", 'Status_Normal', false);
                    caap.SetDisplay("caapDivObject", 'Status_Adv', true);
                } else {
                    caap.SetDisplay("caapDivObject", 'Status_Normal', true);
                    caap.SetDisplay("caapDivObject", 'Status_Adv', false);
                }

                state.setItem("statsMatch", true);
                break;
            case "HideAds" :
                utility.log(9, "HideAds");
                if (e.target.checked) {
                    $('.UIStandardFrame_SidebarAds').css('display', 'none');
                } else {
                    $('.UIStandardFrame_SidebarAds').css('display', 'block');
                }

                break;
            case "HideAdsIframe" :
                utility.log(9, "HideAdsIframe");
                if (e.target.checked) {
                    $("iframe[name*='fb_iframe']").eq(0).parent().css('display', 'none');
                } else {
                    $("iframe[name*='fb_iframe']").eq(0).parent().css('display', 'block');
                }

                caap.dashboardXY.x = state.getItem('caap_top_menuLeft', '');
                caap.dashboardXY.y = state.getItem('caap_top_menuTop', $(caap.dashboardXY.selector).offset().top - 10);
                styleXY = caap.GetDashboardXY();
                caap.caapTopObject.css({
                    top                     : styleXY.y + 'px',
                    left                    : styleXY.x + 'px'
                });

                break;
            case "HideFBChat" :
                utility.log(9, "HideFBChat");
                if (e.target.checked) {
                    $("div[class*='fbDockWrapper fbDockWrapperBottom fbDockWrapperRight']").css('display', 'none');
                } else {
                    $("div[class*='fbDockWrapper fbDockWrapperBottom fbDockWrapperRight']").css('display', 'block');
                }

                break;
            case "BannerDisplay" :
                utility.log(9, "BannerDisplay");
                if (e.target.checked) {
                    caap.caapDivObject.find('#caap_BannerHide').css('display', 'block');
                } else {
                    caap.caapDivObject.find('#caap_BannerHide').css('display', 'none');
                }

                break;
            case "IgnoreBattleLoss" :
                utility.log(9, "IgnoreBattleLoss");
                if (e.target.checked) {
                    utility.log(1, "Ignore Battle Losses has been enabled.");
                }

                break;
            case "SetTitle" :
            case "SetTitleAction" :
            case "SetTitleName" :
                utility.log(9, idName);
                if (e.target.checked) {
                    if (config.getItem('SetTitleAction', false)) {
                        d = caap.caapDivObject.find('#caap_activity_mess').html();
                        if (d) {
                            DocumentTitle += d.replace("Activity: ", '') + " - ";
                        }
                    }

                    if (config.getItem('SetTitleName', false)) {
                        DocumentTitle += caap.stats.PlayerName + " - ";
                    }

                    document.title = DocumentTitle + caap.documentTitle;
                } else {
                    document.title = caap.documentTitle;
                }

                break;
            case "unlockMenu" :
                utility.log(9, "unlockMenu");
                if (e.target.checked) {
                    caap.caapDivObject.find(":input[id^='caap_']").attr({disabled: true});
                    caap.caapTopObject.find(":input[id^='caap_']").attr({disabled: true});
                    caap.caapDivObject.css('cursor', 'move').draggable({
                        stop: function () {
                            caap.SaveControlXY();
                        }
                    });

                    caap.caapTopObject.css('cursor', 'move').draggable({
                        stop: function () {
                            caap.SaveDashboardXY();
                        }
                    });
                } else {
                    caap.caapDivObject.css('cursor', '').draggable("destroy");
                    caap.caapTopObject.css('cursor', '').draggable("destroy");
                    caap.caapDivObject.find(":input[id^='caap_']").attr({disabled: false});
                    caap.caapTopObject.find(":input[id^='caap_']").attr({disabled: false});
                }

                break;
            case "AutoElite" :
                utility.log(9, "AutoElite");
                schedule.setItem('AutoEliteGetList', 0);
                schedule.setItem('AutoEliteReqNext', 0);
                state.setItem('AutoEliteEnd', '');
                state.setItem("MyEliteTodo", []);
                if (!state.getItem('FillArmy', false)) {
                    state.setItem(caap.friendListType.giftc.name + 'Requested', false);
                    state.setItem(caap.friendListType.giftc.name + 'Responded', []);
                }

                break;
            case "AchievementMode" :
                utility.log(9, "AchievementMode");
                monster.flagReview();
                break;
            case "StatSpendAll" :
                state.setItem("statsMatch", true);
                state.setItem("autoStatRuleLog", true);
                break;
            case "chooseIgnoredMinions" :
                state.setItem('staminaGuildMonster', 0);
                break;
            case "enableTitles" :
            case "goblinHinting" :
                if (e.target.checked) {
                    spreadsheet.load();
                }

                break;
            default :
            }

            return true;
        } catch (err) {
            utility.error("ERROR in CheckBoxListener: " + err);
            return false;
        }
    },

    TextBoxListener: function (e) {
        try {
            var idName = e.target.id.replace(/caap_/i, '');

            utility.log(1, 'Change: setting "' + idName + '" to ', String(e.target.value));
            if (/Style+/.test(idName)) {
                switch (idName) {
                case "StyleBackgroundLight" :
                    if (e.target.value.substr(0, 1) !== '#') {
                        e.target.value = '#' + e.target.value;
                    }

                    state.setItem("CustStyleBackgroundLight", e.target.value);
                    break;
                case "StyleBackgroundDark" :
                    if (e.target.value.substr(0, 1) !== '#') {
                        e.target.value = '#' + e.target.value;
                    }

                    state.setItem("CustStyleBackgroundDark", e.target.value);
                    break;
                default :
                }
            } else if (/AttrValue+/.test(idName)) {
                state.setItem("statsMatch", true);
            }

            config.setItem(idName, String(e.target.value));
            return true;
        } catch (err) {
            utility.error("ERROR in TextBoxListener: " + err);
            return false;
        }
    },

    NumberBoxListener: function (e) {
        try {
            var idName  = e.target.id.replace(/caap_/i, ''),
                number  = null,
                message = '';

            if (isNaN(e.target.value) && e.target.value !== '') {
                message = "<div style='text-align: center;'>";
                message += "You entered:<br /><br />";
                message += "'" + e.target.value + "'<br /><br />";
                message += "Please enter a number or leave blank.";
                message += "</div>";
                utility.alert(message, "NumberBox");
                number = '';
            } else {
                number = parseFloat(e.target.value);
                if (isNaN(number)) {
                    number = '';
                }
            }

            utility.log(1, 'Change: setting "' + idName + '" to ', number);
            if (/Style+/.test(idName)) {
                switch (idName) {
                case "StyleOpacityLight" :
                    state.setItem("CustStyleOpacityLight", e.target.value);
                    break;
                case "StyleOpacityDark" :
                    state.setItem("CustStyleOpacityDark", e.target.value);
                    break;
                default :
                }
            } else if (/AttrValue+/.test(idName)) {
                state.setItem("statsMatch", true);
            } else if (/MaxToFortify/.test(idName)) {
                monster.flagFullReview();
            } else if (/Chain/.test(idName)) {
                state.getItem('BattleChainId', 0);
            } else if (idName === 'DebugLevel') {
                utility.logLevel = e.target.value;
            }

            e.target.value = config.setItem(idName, number);
            return true;
        } catch (err) {
            utility.error("ERROR in NumberBoxListener: " + err);
            return false;
        }
    },

    DropBoxListener: function (e) {
        try {
            if (e.target.selectedIndex > 0) {
                var idName = e.target.id.replace(/caap_/i, ''),
                    value  = e.target.options[e.target.selectedIndex].value,
                    title  = e.target.options[e.target.selectedIndex].title;

                utility.log(1, 'Change: setting "' + idName + '" to "' + value + '" with title "' + title + '"');
                config.setItem(idName, value);
                e.target.title = title;
                if (idName === 'WhenQuest' || idName === 'WhenBattle' || idName === 'WhenMonster' || idName === 'WhenGuildMonster') {
                    caap.SetDisplay("caapDivObject", idName + 'Hide', (value !== 'Never'));
                    if (idName === 'WhenBattle' || idName === 'WhenMonster' || idName === 'WhenGuildMonster') {
                        caap.SetDisplay("caapDivObject", idName + 'XStamina', (value === 'At X Stamina'));
                        caap.SetDisplay("caapDivObject", 'WhenBattleStayHidden1', ((config.getItem('WhenBattle', 'Never') === 'Stay Hidden' && config.getItem('WhenMonster', 'Never') !== 'Stay Hidden')));
                        caap.SetDisplay("caapDivObject", 'WhenMonsterStayHidden1', ((config.getItem('WhenMonster', 'Never') === 'Stay Hidden' && config.getItem('WhenBattle', 'Never') !== 'Stay Hidden')));
                        caap.SetDisplay("caapDivObject", 'WhenBattleDemiOnly', (config.getItem('WhenBattle', 'Never') === 'Demi Points Only'));
                        if (idName === 'WhenBattle') {
                            if (value === 'Never') {
                                caap.SetDivContent('battle_mess', 'Battle off');
                            } else {
                                caap.SetDivContent('battle_mess', '');
                            }
                        } else if (idName === 'WhenMonster') {
                            if (value === 'Never') {
                                caap.SetDivContent('monster_mess', 'Monster off');
                            } else {
                                caap.SetDivContent('monster_mess', '');
                            }
                        } else if (idName === 'WhenGuildMonster') {
                            if (value === 'Never') {
                                caap.SetDivContent('guild_monster_mess', 'Guild Monster off');
                            } else {
                                caap.SetDivContent('guild_monster_mess', '');
                            }
                        }
                    }

                    if (idName === 'WhenQuest') {
                        caap.SetDisplay("caapDivObject", idName + 'XEnergy', (value === 'At X Energy'));
                    }
                } else if (idName === 'QuestArea' || idName === 'QuestSubArea' || idName === 'WhyQuest') {
                    state.setItem('AutoQuest', caap.newAutoQuest());
                    caap.ClearAutoQuest();
                    if (idName === 'QuestArea') {
                        switch (value) {
                        case "Quest" :
                            caap.caapDivObject.find("#trQuestSubArea").css('display', 'table-row');
                            caap.ChangeDropDownList('QuestSubArea', caap.landQuestList);
                            break;
                        case "Demi Quests" :
                            caap.caapDivObject.find("#trQuestSubArea").css('display', 'table-row');
                            caap.ChangeDropDownList('QuestSubArea', caap.demiQuestList);
                            break;
                        case "Atlantis" :
                            caap.caapDivObject.find("#trQuestSubArea").css('display', 'table-row');
                            caap.ChangeDropDownList('QuestSubArea', caap.atlantisQuestList);
                            break;
                        default :
                        }
                    }
                } else if (idName === 'BattleType') {
                    state.getItem('BattleChainId', 0);
                } else if (idName === 'TargetType') {
                    state.getItem('BattleChainId', 0);
                    switch (value) {
                    case "Freshmeat" :
                        caap.SetDisplay("caapDivObject", 'FreshmeatSub', true);
                        caap.SetDisplay("caapDivObject", 'UserIdsSub', false);
                        caap.SetDisplay("caapDivObject", 'RaidSub', false);
                        break;
                    case "Userid List" :
                        caap.SetDisplay("caapDivObject", 'FreshmeatSub', false);
                        caap.SetDisplay("caapDivObject", 'UserIdsSub', true);
                        caap.SetDisplay("caapDivObject", 'RaidSub', false);
                        break;
                    case "Raid" :
                        caap.SetDisplay("caapDivObject", 'FreshmeatSub', true);
                        caap.SetDisplay("caapDivObject", 'UserIdsSub', false);
                        caap.SetDisplay("caapDivObject", 'RaidSub', true);
                        break;
                    default :
                        caap.SetDisplay("caapDivObject", 'FreshmeatSub', true);
                        caap.SetDisplay("caapDivObject", 'UserIdsSub', false);
                        caap.SetDisplay("caapDivObject", 'RaidSub', false);
                    }
                } else if (idName === 'LevelUpGeneral') {
                    caap.SetDisplay("caapDivObject", idName + 'Hide', (value !== 'Use Current'));
                } else if (/Attribute?/.test(idName)) {
                    state.setItem("statsMatch", true);
                } else if (idName === 'DisplayStyle') {
                    caap.SetDisplay("caapDivObject", idName + 'Hide', (value === 'Custom'));
                    switch (value) {
                    case "CA Skin" :
                        config.setItem("StyleBackgroundLight", "#E0C691");
                        config.setItem("StyleBackgroundDark", "#B09060");
                        config.setItem("StyleOpacityLight", 1);
                        config.setItem("StyleOpacityDark", 1);
                        break;
                    case "None" :
                        config.setItem("StyleBackgroundLight", "white");
                        config.setItem("StyleBackgroundDark", "white");
                        config.setItem("StyleOpacityLight", 1);
                        config.setItem("StyleOpacityDark", 1);
                        break;
                    case "Custom" :
                        config.setItem("StyleBackgroundLight", state.getItem("CustStyleBackgroundLight", "#E0C691"));
                        config.setItem("StyleBackgroundDark", state.getItem("CustStyleBackgroundDark", "#B09060"));
                        config.setItem("StyleOpacityLight", state.getItem("CustStyleOpacityLight", 1));
                        config.setItem("StyleOpacityDark", state.getItem("CustStyleOpacityDark", 1));
                        break;
                    default :
                        config.setItem("StyleBackgroundLight", "#efe");
                        config.setItem("StyleBackgroundDark", "#fee");
                        config.setItem("StyleOpacityLight", 1);
                        config.setItem("StyleOpacityDark", 1);
                    }

                    caap.caapDivObject.css({
                        background: config.getItem('StyleBackgroundDark', '#fee'),
                        opacity: config.getItem('StyleOpacityDark', 1)
                    });

                    caap.caapTopObject.css({
                        background: config.getItem('StyleBackgroundDark', '#fee'),
                        opacity: config.getItem('StyleOpacityDark', 1)
                    });
                }
            }

            return true;
        } catch (err) {
            utility.error("ERROR in DropBoxListener: " + err);
            return false;
        }
    },

    TextAreaListener: function (e) {
        try {
            var idName = e.target.id.replace(/caap_/i, ''),
                value = e.target.value;

            utility.log(1, 'Change: setting "' + idName + '" to ', value);
            if (idName === 'orderbattle_monster' || idName === 'orderraid') {
                monster.flagFullReview();
            } else if (idName === 'BattleTargets') {
                state.getItem('BattleChainId', 0);
            }

            caap.SaveBoxText(idName);
            return true;
        } catch (err) {
            utility.error("ERROR in TextAreaListener: " + err);
            return false;
        }
    },

    PauseListener: function (e) {
        caap.caapDivObject.css({
            'background': config.getItem('StyleBackgroundDark', '#fee'),
            'opacity': '1',
            'z-index': '3'
        });

        caap.caapTopObject.css({
            'background': config.getItem('StyleBackgroundDark', '#fee'),
            'opacity': '1'
        });

        caap.caapDivObject.find('#caapPaused').css('display', 'block');
        state.setItem('caapPause', 'block');
    },

    RestartListener: function (e) {
        caap.caapDivObject.find('#caapPaused').css('display', 'none');
        caap.caapDivObject.css({
            'background': config.getItem('StyleBackgroundLight', '#efe'),
            'opacity': config.getItem('StyleOpacityLight', 1),
            'z-index': state.getItem('caap_div_zIndex', '2'),
            'cursor': ''
        });

        caap.caapTopObject.css({
            'background': config.getItem('StyleBackgroundLight', '#efe'),
            'opacity': config.getItem('StyleOpacityLight', 1),
            'z-index': state.getItem('caap_top_zIndex', '1'),
            'cursor': ''
        });

        caap.caapDivObject.find(":input[id*='caap_']").attr({disabled: false});
        caap.caapDivObject.find('#unlockMenu').attr('checked', false);
        state.setItem('caapPause', 'none');
        state.setItem('ReleaseControl', true);
        state.setItem('resetselectMonster', true);
        caap.waitingForDomLoad = false;
    },

    ResetMenuLocationListener: function (e) {
        var caap_divXY = {},
            caap_topXY = {};

        state.deleteItem('caap_div_menuLeft');
        state.deleteItem('caap_div_menuTop');
        state.deleteItem('caap_div_zIndex');
        caap.controlXY.x = '';
        caap.controlXY.y = $(caap.controlXY.selector).offset().top;
        caap_divXY = caap.GetControlXY(true);
        caap.caapDivObject.css({
            'cursor' : '',
            'z-index' : '2',
            'top' : caap_divXY.y + 'px',
            'left' : caap_divXY.x + 'px'
        });

        state.deleteItem('caap_top_menuLeft');
        state.deleteItem('caap_top_menuTop');
        state.deleteItem('caap_top_zIndex');
        caap.dashboardXY.x = '';
        caap.dashboardXY.y = $(caap.dashboardXY.selector).offset().top - 10;
        caap_topXY = caap.GetDashboardXY(true);
        caap.caapTopObject.css({
            'cursor' : '',
            'z-index' : '1',
            'top' : caap_topXY.y + 'px',
            'left' : caap_topXY.x + 'px'
        });

        caap.caapDivObject.find(":input[id^='caap_']").attr({disabled: false});
        caap.caapTopObject.find(":input[id^='caap_']").attr({disabled: false});
    },

    FoldingBlockListener: function (e) {
        try {
            var subId = e.target.id.replace(/_Switch/i, ''),
                subDiv = document.getElementById(subId);

            if (subDiv.style.display === "block") {
                utility.log(2, 'Folding: ', subId);
                subDiv.style.display = "none";
                e.target.innerHTML = e.target.innerHTML.replace(/-/, '+');
                state.setItem('Control_' + subId.replace(/caap_/i, ''), "none");
            } else {
                utility.log(2, 'Unfolding: ', subId);
                subDiv.style.display = "block";
                e.target.innerHTML = e.target.innerHTML.replace(/\+/, '-');
                state.setItem('Control_' + subId.replace(/caap_/i, ''), "block");
            }

            return true;
        } catch (err) {
            utility.error("ERROR in FoldingBlockListener: " + err);
            return false;
        }
    },

    whatClickedURLListener: function (event) {
        var obj = event.target;
        while (obj && !obj.href) {
            obj = obj.parentNode;
        }

        if (obj && obj.href) {
            state.setItem('clickUrl', obj.href);
            schedule.setItem('clickedOnSomething', 0);
            caap.waitingForDomLoad = true;
            //utility.log(9, 'globalContainer', obj.href);
        } else {
            if (obj && !obj.href) {
                utility.warn('whatClickedURLListener globalContainer no href', obj);
            }
        }
    },

    whatFriendBox: function (event) {
        utility.log(9, 'whatFriendBox', event);
        var obj    = event.target,
            userID = [],
            txt    = '';

        while (obj && !obj.id) {
            obj = obj.parentNode;
        }

        if (obj && obj.id) {
            //utility.log(9, 'globalContainer', obj.onclick);
            userID = obj.onclick.toString().match(/friendKeepBrowse\('([0-9]+)'/);
            if (userID && userID.length === 2) {
                txt = "?casuser=" + userID[1];
            }

            state.setItem('clickUrl', 'http://apps.facebook.com/castle_age/keep.php' + txt);
            schedule.setItem('clickedOnSomething', 0);
            caap.waitingForDomLoad = true;
        }

        //utility.log(9, 'globalContainer', obj.id, txt);
    },

    guildMonsterEngageListener: function (event) {
        var butArr       = [],
            buttonRegExp = new RegExp("'globalContainer', '(.*)'");

        butArr = $(event.target).parents("form").eq(0).attr("onsubmit").match(buttonRegExp);
        if (butArr && butArr.length === 2) {
            utility.log(4, "engage", butArr[1]);
            state.setItem('clickUrl', 'http://apps.facebook.com/castle_age/' + butArr[1]);
            schedule.setItem('clickedOnSomething', 0);
            caap.waitingForDomLoad = true;
        }
    },

    guildMonsterDuelListener: function (event) {
        var butArr       = [],
            buttonRegExp = new RegExp("'globalContainer', '(.*)'");

        butArr = $(event.target).parents("form").eq(0).attr("onsubmit").match(buttonRegExp);
        if (butArr && butArr.length === 2) {
            utility.log(4, "duel", butArr[1]);
            state.setItem('clickUrl', 'http://apps.facebook.com/castle_age/' + butArr[1]);
            schedule.setItem('clickedOnSomething', 0);
            caap.waitingForDomLoad = true;
        }
    },

    windowResizeListener: function (e) {
        if (window.location.href.indexOf('castle_age')) {
            var caap_divXY = caap.GetControlXY(),
                caap_topXY = caap.GetDashboardXY();

            caap.caapDivObject.css('left', caap_divXY.x + 'px');
            caap.caapTopObject.css('left', caap_topXY.x + 'px');
        }
    },

    targetList: [
        "app_body",
        "index",
        "keep",
        "generals",
        "battle_monster",
        "battle",
        "battlerank",
        "battle_train",
        "arena",
        "quests",
        "raid",
        "symbolquests",
        "alchemy",
        "goblin_emp",
        "soldiers",
        "item",
        "land",
        "magic",
        "oracle",
        "symbols",
        "treasure_chest",
        "gift",
        "apprentice",
        "news",
        "friend_page",
        "party",
        "comments",
        "army",
        "army_news_feed",
        "army_reqs",
        "guild",
        "guild_panel",
        "guild_current_battles",
        "guild_current_monster_battles",
        "guild_battle_monster",
        "guild_monster_summon_list"
    ],

    AddListeners: function () {
        try {
            var caapDiv         = null,
                globalContainer = null;

            utility.log(4, "Adding listeners for caap_div");
            if (this.caapDivObject.length === 0) {
                throw "Unable to find div for caap_div";
            }

            this.caapDivObject.find('input:checkbox[id^="caap_"]').change(this.CheckBoxListener);
            this.caapDivObject.find('input[data-subtype="text"]').change(this.TextBoxListener);
            this.caapDivObject.find('input[data-subtype="number"]').change(this.NumberBoxListener);
            this.caapDivObject.find('#unlockMenu').change(this.CheckBoxListener);
            this.caapDivObject.find('select[id^="caap_"]').change(this.DropBoxListener);
            this.caapDivObject.find('textarea[id^="caap_"]').change(this.TextAreaListener);
            this.caapDivObject.find('a[id^="caap_Switch"]').click(this.FoldingBlockListener);
            this.caapDivObject.find('#caap_FillArmy').click(function (e) {
                state.setItem("FillArmy", true);
                state.setItem("ArmyCount", 0);
                state.setItem('FillArmyList', []);
                state.setItem(caap.friendListType.giftc.name + 'Responded', []);
                state.setItem(caap.friendListType.facebook.name + 'Responded', false);

            });

            this.caapDivObject.find('#caap_StartedColorSelect').click(function (e) {
                var display = 'none';
                if ($('#caap_ColorSelectorDiv1').css('display') === 'none') {
                    display = 'block';
                }

                $('#caap_ColorSelectorDiv1').css('display', display);
            });

            this.caapDivObject.find('#caap_StopedColorSelect').click(function (e) {
                var display = 'none';
                if ($('#caap_ColorSelectorDiv2').css('display') === 'none') {
                    display = 'block';
                }

                $('#caap_ColorSelectorDiv2').css('display', display);
            });

            this.caapDivObject.find('#caap_ResetMenuLocation').click(this.ResetMenuLocationListener);
            this.caapDivObject.find('#caap_resetElite').click(function (e) {
                schedule.setItem('AutoEliteGetList', 0);
                schedule.setItem('AutoEliteReqNext', 0);
                state.setItem('AutoEliteEnd', '');
                if (!state.getItem('FillArmy', false)) {
                    state.setItem(caap.friendListType.giftc.name + 'Requested', false);
                    state.setItem(caap.friendListType.giftc.name + 'Responded', []);
                }
            });

            this.caapDivObject.find('#caapRestart').click(this.RestartListener);
            this.caapDivObject.find('#caap_control').mousedown(this.PauseListener);
            this.caapDivObject.find('#stopAutoQuest').click(function (e) {
                utility.log(1, 'Change: setting stopAutoQuest and go to Manual');
                caap.ManualAutoQuest();
            });

            globalContainer = $('#app46755028429_globalContainer');
            if (globalContainer.length === 0) {
                throw 'Global Container not found';
            }

            // Fires when CAAP navigates to new location
            //globalContainer.find('a').bind('click', this.whatClickedURLListener);
            //globalContainer.find("div[id*='app46755028429_friend_box_']").bind('click', this.whatFriendBox);
            globalContainer.find('a').unbind('click', caap.whatClickedURLListener).bind('click', caap.whatClickedURLListener);
            globalContainer.find("div[id*='app46755028429_friend_box_']").unbind('click', caap.whatFriendBox).bind('click', caap.whatFriendBox);
            if (globalContainer.find("img[src*='guild_monster_list_button_on.jpg']").length) {
                globalContainer.find("input[src*='dragon_list_btn_']").unbind('click', caap.guildMonsterEngageListener).bind('click', caap.guildMonsterEngageListener);
            }

            if (globalContainer.find("#app46755028429_guild_battle_banner_section").length) {
                globalContainer.find("input[src*='guild_duel_button']").unbind('click', caap.guildMonsterDuelListener).bind('click', caap.guildMonsterDuelListener);
            }

            globalContainer.bind('DOMNodeInserted', function (event) {
                var targetStr = event.target.id.replace('app46755028429_', ''),
                    payTimer  = null,
                    energy    = 0,
                    tempE     = null,
                    tempET    = null,
                    health    = 0,
                    tempH     = null,
                    tempHT    = null,
                    stamina   = 0,
                    tempS     = null,
                    tempST    = null,
                    images    = null;

                // Uncomment this to see the id of domNodes that are inserted
                /*
                if (event.target.id && !event.target.id.match(/globalContainer/) && !event.target.id.match(/time/i) && !event.target.id.match(/ticker/i) && !event.target.id.match(/caap/i)) {
                    caap.SetDivContent('debug2_mess', targetStr);
                    alert(event.target.id);
                }
                */

                if (config.getItem('HideAdsIframe', false)) {
                    $("iframe[name*='fb_iframe']").eq(0).parent().css('display', 'none');
                }

                if ($.inArray(targetStr, caap.targetList) !== -1) {
                    utility.log(5, "Refreshing DOM Listeners", event.target.id);
                    caap.waitingForDomLoad = false;
                    globalContainer.find('a').unbind('click', caap.whatClickedURLListener).bind('click', caap.whatClickedURLListener);
                    globalContainer.find("div[id*='app46755028429_friend_box_']").unbind('click', caap.whatFriendBox).bind('click', caap.whatFriendBox);
                    caap.IncrementPageLoadCounter();
                    window.setTimeout(function () {
                        caap.CheckResults();
                    }, 100);
                }

                if (targetStr === "app_body") {
                    if (globalContainer.find("img[src*='guild_monster_list_button_on.jpg']").length) {
                        utility.log(2, "Checking Guild Current Monster Battles");
                        globalContainer.find("input[src*='dragon_list_btn_']").unbind('click', caap.guildMonsterEngageListener).bind('click', caap.guildMonsterEngageListener);
                    }
                }

                if (targetStr === "guild_battle_monster") {
                    utility.log(2, "Checking Guild Battles Monster");
                    globalContainer.find("input[src*='guild_duel_button']").unbind('click', caap.guildMonsterDuelListener).bind('click', caap.guildMonsterDuelListener);
                }

                if ((targetStr === "battle" || targetStr === "raid") && battle.flagResult) {
                    utility.log(2, "Checking Battle Results");
                    battle.checkResults();
                    battle.flagResult = false;
                }

                // Income timer
                if (targetStr === "gold_time_value") {
                    payTimer = $(event.target).text().match(/([0-9]+):([0-9]+)/);
                    utility.log(5, "gold_time_value", payTimer);
                    if (payTimer && payTimer.length === 3) {
                        caap.stats.gold.payTime.ticker = payTimer[0];
                        caap.stats.gold.payTime.minutes = parseInt(payTimer[1], 10);
                        caap.stats.gold.payTime.seconds = parseInt(payTimer[2], 10);
                    }
                }

                // Energy
                if (targetStr === "energy_current_value") {
                    energy = parseInt($(event.target).text(), 10);
                    utility.log(5, "energy_current_value", energy);
                    if (utility.isNum(energy)) {
                        tempE = caap.GetStatusNumbers(energy + "/" + caap.stats.energy.max);
                        tempET = caap.GetStatusNumbers(energy + "/" + caap.stats.energyT.max);
                        if (tempE && tempET) {
                            caap.stats.energy = tempE;
                            caap.stats.energyT = tempET;
                        } else {
                            utility.warn("Unable to get energy levels");
                        }
                    }
                }

                // Health
                if (targetStr === "health_current_value") {
                    health = parseInt($(event.target).text(), 10);
                    utility.log(5, "health_current_value", health);
                    if (utility.isNum(health)) {
                        tempH = caap.GetStatusNumbers(health + "/" + caap.stats.health.max);
                        tempHT = caap.GetStatusNumbers(health + "/" + caap.stats.healthT.max);
                        if (tempH && tempHT) {
                            caap.stats.health = tempH;
                            caap.stats.healthT = tempHT;
                        } else {
                            utility.warn("Unable to get health levels");
                        }
                    }
                }

                // Stamina
                if (targetStr === "stamina_current_value") {
                    stamina = parseInt($(event.target).text(), 10);
                    utility.log(5, "stamina_current_value", stamina);
                    if (utility.isNum(stamina)) {
                        tempS = caap.GetStatusNumbers(stamina + "/" + caap.stats.stamina.max);
                        tempST = caap.GetStatusNumbers(stamina + "/" + caap.stats.staminaT.max);
                        if (tempS) {
                            caap.stats.stamina = tempS;
                            caap.stats.staminaT = tempST;
                        } else {
                            utility.warn("Unable to get stamina levels");
                        }
                    }
                }

                // Reposition the dashboard
                if (event.target.id === caap.dashboardXY.selector) {
                    caap.caapTopObject.css('left', caap.GetDashboardXY().x + 'px');
                }
            });

            $(window).unbind('resize', this.windowResizeListener).bind('resize', this.windowResizeListener);
            utility.log(4, "Listeners added for caap_div");
            return true;
        } catch (err) {
            utility.error("ERROR in AddListeners: " + err);
            return false;
        }
    },

    /////////////////////////////////////////////////////////////////////
    //                          CHECK RESULTS
    // Called each iteration of main loop, this does passive checks for
    // results to update other functions.
    /////////////////////////////////////////////////////////////////////

    SetCheckResultsFunction: function (resultsFunction) {
        schedule.setItem('SetResultsFunctionTimer', 20);
        state.setItem('ResultsFunction', resultsFunction);
    },

    pageList: {
        'index': {
            signaturePic: 'gif',
            CheckResultsFunction: 'CheckResults_index'
        },
        'battle_monster': {
            signaturePic: 'tab_monster_list_on.gif',
            CheckResultsFunction: 'CheckResults_fightList',
            subpages: ['onMonster']
        },
        'onMonster': {
            signaturePic: 'tab_monster_active.gif',
            CheckResultsFunction: 'CheckResults_viewFight'
        },
        'raid': {
            signaturePic: 'tab_raid_on.gif',
            CheckResultsFunction: 'CheckResults_fightList',
            subpages: ['onRaid']
        },
        'onRaid': {
            signaturePic: 'raid_map',
            CheckResultsFunction : 'CheckResults_viewFight'
        },
        'land': {
            signaturePic: 'tab_land_on.gif',
            CheckResultsFunction: 'CheckResults_land'
        },
        'generals': {
            signaturePic: 'tab_generals_on.gif',
            CheckResultsFunction: 'CheckResults_generals'
        },
        'quests': {
            signaturePic: 'tab_quest_on.gif',
            CheckResultsFunction: 'CheckResults_quests'
        },
        'symbolquests': {
            signaturePic: 'demi_quest_on.gif',
            CheckResultsFunction: 'CheckResults_quests'
        },
        'monster_quests': {
            signaturePic: 'tab_atlantis_on.gif',
            CheckResultsFunction: 'CheckResults_quests'
        },
        'gift_accept': {
            signaturePic: 'gif',
            CheckResultsFunction: 'CheckResults_gift_accept'
        },
        'army': {
            signaturePic: 'invite_on.gif',
            CheckResultsFunction: 'CheckResults_army'
        },
        'keep': {
            signaturePic: 'tab_stats_on.gif',
            CheckResultsFunction: 'CheckResults_keep'
        },
        'oracle': {
            signaturePic: 'oracle_on.gif',
            CheckResultsFunction: 'CheckResults_oracle'
        },
        'alchemy': {
            signaturePic: 'tab_alchemy_on.gif',
            CheckResultsFunction: 'CheckResults_alchemy'
        },
        'battlerank': {
            signaturePic: 'tab_battle_rank_on.gif',
            CheckResultsFunction: 'CheckResults_battlerank'
        },
        'war_rank': {
            signaturePic: 'tab_war_on.gif',
            CheckResultsFunction: 'CheckResults_war_rank'
        },
        'achievements': {
            signaturePic: 'tab_achievements_on.gif',
            CheckResultsFunction: 'CheckResults_achievements'
        },
        'battle': {
            signaturePic: 'battle_on.gif',
            CheckResultsFunction: 'CheckResults_battle'
        },
        'soldiers': {
            signaturePic: 'tab_soldiers_on.gif',
            CheckResultsFunction: 'CheckResults_soldiers'
        },
        'item': {
            signaturePic: 'tab_black_smith_on.gif',
            CheckResultsFunction: 'CheckResults_item'
        },
        'magic': {
            signaturePic: 'tab_magic_on.gif',
            CheckResultsFunction: 'CheckResults_magic'
        },
        'gift': {
            signaturePic: 'tab_gifts_on.gif',
            CheckResultsFunction: 'CheckResults_gift'
        },
        'goblin_emp': {
            signaturePic: 'emporium_cancel.gif',
            CheckResultsFunction: 'CheckResults_goblin_emp'
        },
        'view_class_progress': {
            signaturePic: 'nm_class_whole_progress_bar.jpg',
            CheckResultsFunction: 'CheckResults_view_class_progress'
        },
        'guild': {
            signaturePic: 'tab_guild_main_on.gif',
            CheckResultsFunction: 'CheckResults_guild'
        },
        'guild_current_battles': {
            signaturePic: 'tab_guild_current_battles_on.gif',
            CheckResultsFunction: 'CheckResults_guild_current_battles'
        },
        'guild_current_monster_battles': {
            signaturePic: 'guild_monster_tab_on.jpg',
            CheckResultsFunction: 'CheckResults_guild_current_monster_battles'
        },
        'guild_battle_monster': {
            signatureId: 'app46755028429_guild_battle_banner_section',
            CheckResultsFunction: 'CheckResults_guild_battle_monster'
        }
    },

    AddExpDisplay: function () {
        try {
            var expDiv = $("#app46755028429_st_2_5 strong"),
                enlDiv = null;

            if (!expDiv.length) {
                utility.warn("Unable to get experience array");
                return false;
            }

            enlDiv = expDiv.find("#caap_enl");
            if (enlDiv.length) {
                utility.log(5, "Experience to Next Level already displayed. Updating.");
                enlDiv.html(this.stats.exp.dif);
            } else {
                utility.log(5, "Prepending Experience to Next Level to display");
                expDiv.prepend("(<span id='caap_enl' style='color:red'>" + (this.stats.exp.dif) + "</span>) ");
            }

            this.SetDivContent('exp_mess', "Experience to next level: " + this.stats.exp.dif);
            return true;
        } catch (err) {
            utility.error("ERROR in AddExpDisplay: " + err);
            return false;
        }
    },

    CheckResults: function () {
        try {
            // Check page to see if we should go to a page specific check function
            // todo find a way to verify if a function exists, and replace the array with a check_functionName exists check
            if (!schedule.check('CheckResultsTimer')) {
                return false;
            }

            this.pageLoadOK = this.GetStats();
            this.AddExpDisplay();
            this.SetDivContent('level_mess', 'Expected next level: ' + schedule.FormatTime(new Date(this.stats.indicators.enl)));
            if ((config.getItem('DemiPointsFirst', false) && config.getItem('WhenMonster', 'Never') !== 'Never') || config.getItem('WhenBattle', 'Never') === 'Demi Points Only') {
                if (state.getItem('DemiPointsDone', true)) {
                    this.SetDivContent('demipoint_mess', 'Daily Demi Points: Done');
                } else {
                    if (config.getItem('DemiPointsFirst', false) && config.getItem('WhenMonster', 'Never') !== 'Never') {
                        this.SetDivContent('demipoint_mess', 'Daily Demi Points: First');
                    } else {
                        this.SetDivContent('demipoint_mess', 'Daily Demi Points: Only');
                    }
                }
            } else {
                this.SetDivContent('demipoint_mess', '');
            }

            if (schedule.display('BlessingTimer')) {
                if (schedule.check('BlessingTimer')) {
                    this.SetDivContent('demibless_mess', 'Demi Blessing = none');
                } else {
                    this.SetDivContent('demibless_mess', 'Next Demi Blessing: ' + schedule.display('BlessingTimer'));
                }
            }

            schedule.setItem('CheckResultsTimer', 1);
            state.getItem('page', '');
            state.setItem('pageUserCheck', '');
            var pageUrl = state.getItem('clickUrl', '');
            utility.log(5, "Page url", pageUrl);
            if (pageUrl) {
                var pageUserCheck = pageUrl.match(/user=([0-9]+)/);
                utility.log(6, "pageUserCheck", pageUserCheck);
                if (pageUserCheck) {
                    state.setItem('pageUserCheck', pageUserCheck[1]);
                }
            }

            var page = 'None',
                sigImage = '',
                appBodyDiv = $("#app46755028429_app_body");

            if (pageUrl.match(new RegExp("\/[^\/]+.php", "i"))) {
                page = pageUrl.match(new RegExp("\/[^\/]+.php", "i"))[0].replace('/', '').replace('.php', '');
                utility.log(5, "Page match", page);
            }

            if (this.pageList[page]) {
                if (page === "quests" && this.stats.level < 8) {
                    sigImage = "quest_back_1.jpg";
                } else {
                    sigImage = this.pageList[page].signaturePic;
                }

                if (appBodyDiv.find("img[src*='" + sigImage + "']").length) {
                    state.setItem('page', page);
                    utility.log(9, "Page set value", page);
                }

                if (this.pageList[page].subpages) {
                    this.pageList[page].subpages.forEach(function (subpage) {
                        if (appBodyDiv.find("img[src*='" + caap.pageList[subpage].signaturePic + "']").length) {
                            page = state.setItem('page', subpage);
                            utility.log(5, "Page subpage", page);
                        }
                    });
                } else if (this.pageList[page].subsection) {
                    this.pageList[page].subsection.forEach(function (subsection) {
                        if (appBodyDiv.find("#" + caap.pageList[subsection].signatureId).length) {
                            page = state.setItem('page', subsection);
                            utility.log(5, "Page subsection", page);
                        }
                    });
                }
            }

            var resultsDiv = appBodyDiv.find("#app46755028429_results_main_wrapper span[class*='result_body']"),
                resultsText = '';

            if (resultsDiv && resultsDiv.length) {
                resultsText = $.trim(resultsDiv.text());
            }

            if (page && this.pageList[page]) {
                utility.log(2, 'Checking results for', page);
                if (typeof this[this.pageList[page].CheckResultsFunction] === 'function') {
                    this[this.pageList[page].CheckResultsFunction](resultsText);
                } else {
                    utility.warn('Check Results function not found', this.pageList[page]);
                }
            } else {
                utility.log(2, 'No results check defined for', page);
            }

            monster.select();
            this.UpdateDashboard();
            if (general.List.length <= 2) {
                schedule.setItem("generals", 0);
                schedule.setItem("allGenerals", 0);
                this.CheckGenerals();
            }

            if (this.stats.level < 10) {
                this.battlePage = 'battle_train,battle_off';
            } else {
                this.battlePage = 'battle';
            }

            // Check for Elite Guard Add image
            if (!config.getItem('AutoEliteIgnore', false)) {
                if (utility.CheckForImage('elite_guard_add') && state.getItem('AutoEliteEnd', 'NoArmy') !== 'NoArmy') {
                    schedule.setItem('AutoEliteGetList', 0);
                }
            }

            // If set and still recent, go to the function specified in 'ResultsFunction'
            var resultsFunction = state.getItem('ResultsFunction', '');
            if ((resultsFunction) && !schedule.check('SetResultsFunctionTimer')) {
                this[resultsFunction](resultsText);
            }

            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults: " + err);
            return false;
        }
    },

    CheckResults_generals: function () {
        try {
            var currentGeneral = '',
                html           = '';

            general.GetGenerals();
            currentGeneral = general.GetEquippedStats();
            if (currentGeneral) {
                html = "<span title='Equipped Attack Power Index' style='font-size: 12px; font-weight: normal;'>EAPI:" + currentGeneral.eapi.toFixed(2) +
                       "</span> <span title='Equipped Defense Power Index' style='font-size: 12px; font-weight: normal;'>EDPI:" + currentGeneral.edpi.toFixed(2) +
                       "</span> <span title='Equipped Mean Power Index' style='font-size: 12px; font-weight: normal;'>EMPI:" + currentGeneral.empi.toFixed(2) + "</span>";
                $("#app46755028429_app_body #app46755028429_general_name_div_int").append(html);
            }

            schedule.setItem("generals", gm.getItem("CheckGenerals", 24, hiddenVar) * 3600, 300);
            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults_generals: " + err);
            return false;
        }
    },

    /////////////////////////////////////////////////////////////////////
    //                          GET STATS
    // Functions that records all of base game stats, energy, stamina, etc.
    /////////////////////////////////////////////////////////////////////

    // text in the format '123/234'
    GetStatusNumbers: function (text) {
        try {
            var txtArr = [];

            if (text === '' || typeof text !== 'string') {
                throw "No text supplied for status numbers:" + text;
            }

            txtArr = text.match(/([0-9]+)\/([0-9]+)/);
            if (txtArr.length !== 3) {
                throw "Unable to match status numbers" + text;
            }

            return {
                num: parseInt(txtArr[1], 10),
                max: parseInt(txtArr[2], 10),
                dif: parseInt(txtArr[2], 10) - parseInt(txtArr[1], 10)
            };
        } catch (err) {
            utility.error("ERROR in GetStatusNumbers: " + err);
            return false;
        }
    },

    stats: {
        FBID       : 0,
        account    : '',
        PlayerName : '',
        level      : 0,
        army       : {
            actual : 0,
            capped : 0
        },
        generals   : {
            total  : 0,
            invade : 0
        },
        attack     : 0,
        defense    : 0,
        points     : {
            skill : 0,
            favor : 0
        },
        indicators : {
            bsi  : 0,
            lsi  : 0,
            sppl : 0,
            api  : 0,
            dpi  : 0,
            mpi  : 0,
            htl  : 0,
            hrtl : 0,
            enl  : new Date(2009, 1, 1).getTime()
        },
        gold : {
            cash    : 0,
            bank    : 0,
            total   : 0,
            income  : 0,
            upkeep  : 0,
            flow    : 0,
            payTime : {
                ticker  : '0:00',
                minutes : 0,
                seconds : 0
            }
        },
        rank : {
            battle       : 0,
            battlePoints : 0,
            war          : 0,
            warPoints    : 0
        },
        potions : {
            energy  : 0,
            stamina : 0
        },
        energy : {
            num : 0,
            max : 0,
            dif : 0
        },
        energyT : {
            num : 0,
            max : 0,
            dif : 0
        },
        health : {
            num : 0,
            max : 0,
            dif : 0
        },
        healthT : {
            num : 0,
            max : 0,
            dif : 0
        },
        stamina : {
            num : 0,
            max : 0,
            dif : 0
        },
        staminaT : {
            num : 0,
            max : 0,
            dif : 0
        },
        exp : {
            num : 0,
            max : 0,
            dif : 0
        },
        other : {
            qc       : 0,
            bww      : 0,
            bwl      : 0,
            te       : 0,
            tee      : 0,
            wlr      : 0,
            eer      : 0,
            atlantis : false
        },
        achievements : {
            battle : {
                invasions : {
                    won    : 0,
                    lost   : 0,
                    streak : 0,
                    ratio  : 0
                },
                duels : {
                    won    : 0,
                    lost   : 0,
                    streak : 0,
                    ratio  : 0
                }
            },
            monster : {
                gildamesh : 0,
                colossus  : 0,
                sylvanas  : 0,
                keira     : 0,
                legion    : 0,
                skaar     : 0,
                lotus     : 0,
                dragons   : 0,
                cronus    : 0,
                sieges    : 0,
                genesis   : 0,
                gehenna   : 0,
                aurelius  : 0
            },
            other : {
                alchemy : 0
            }
        },
        character : {
            warrior : {
                name    : 'Warrior',
                level   : 0,
                percent : 0
            },
            rogue : {
                name    : 'Rogue',
                level   : 0,
                percent : 0
            },
            mage : {
                name    : 'Mage',
                level   : 0,
                percent : 0
            },
            cleric : {
                name    : 'Cleric',
                level   : 0,
                percent : 0
            },
            warlock : {
                name    : 'Warlock',
                level   : 0,
                percent : 0
            },
            ranger : {
                name    : 'Ranger',
                level   : 0,
                percent : 0
            }
        },
        guild : {
            name    : '',
            id      : '',
            mPoints : 0,
            bPoints : 0,
            members : 0
        }
    },

    LoadStats: function () {
        if (gm.getItem('stats.record', 'default') === 'default' || !$.isPlainObject(gm.getItem('stats.record', 'default'))) {
            gm.setItem('stats.record', this.stats);
        } else {
            $.extend(this.stats, gm.getItem('stats.record', this.stats));
        }

        utility.log(4, "Stats", this.stats);
        state.setItem("UserDashUpdate", true);
    },

    SaveStats: function () {
        gm.setItem('stats.record', this.stats);
        utility.log(4, "Stats", this.stats);
        state.setItem("UserDashUpdate", true);
    },

    ststbDiv: $("#app46755028429_main_ststb"),

    bntpDiv: $("#app46755028429_main_bntp"),

    GetStats: function () {
        try {
            var cashDiv        = null,
                energyDiv      = null,
                healthDiv      = null,
                staminaDiv     = null,
                expDiv         = null,
                levelDiv       = null,
                armyDiv        = null,
                pointsDiv      = null,
                passed         = true,
                temp           = null,
                tempT          = null,
                levelArray     = [],
                newLevel       = 0,
                newPoints      = 0,
                armyArray      = [],
                pointsArray    = [],
                xS             = 0,
                xE             = 0,
                ststbDiv       = null,
                bntpDiv        = null;

            utility.log(3, "Getting Gold, Energy, Health, Stamina and Experience");
            ststbDiv = $("#app46755028429_main_ststb");
            bntpDiv = $("#app46755028429_main_bntp");
            // gold
            cashDiv = ststbDiv.find("#app46755028429_gold_current_value");
            if (cashDiv.length) {
                utility.log(8, 'Getting current cash value');
                temp = utility.NumberOnly(cashDiv.text());
                if (!isNaN(temp)) {
                    this.stats.gold.cash = temp;
                    this.stats.gold.total = this.stats.gold.bank + this.stats.gold.cash;
                } else {
                    utility.warn("Cash value is not a number", temp);
                    passed = false;
                }
            } else {
                utility.warn("Unable to get cashDiv");
                passed = false;
            }

            // energy
            energyDiv = ststbDiv.find("#app46755028429_st_2_2");
            if (energyDiv.length) {
                utility.log(8, 'Getting current energy levels');
                tempT = this.GetStatusNumbers(energyDiv.text());
                temp = this.GetStatusNumbers(tempT.num + "/" + this.stats.energy.max);
                if (temp && tempT) {
                    this.stats.energy = temp;
                    this.stats.energyT = tempT;
                } else {
                    utility.warn("Unable to get energy levels");
                    passed = false;
                }
            } else {
                utility.warn("Unable to get energyDiv");
                passed = false;
            }

            // health
            healthDiv = ststbDiv.find("#app46755028429_st_2_3");
            if (healthDiv.length) {
                utility.log(8, 'Getting current health levels');
                tempT = this.GetStatusNumbers(healthDiv.text());
                temp = this.GetStatusNumbers(tempT.num + "/" + this.stats.health.max);
                if (temp && tempT) {
                    this.stats.health = temp;
                    this.stats.healthT = tempT;
                } else {
                    utility.warn("Unable to get health levels");
                    passed = false;
                }
            } else {
                utility.warn("Unable to get healthDiv");
                passed = false;
            }

            // stamina
            staminaDiv = ststbDiv.find("#app46755028429_st_2_4");
            if (staminaDiv.length) {
                utility.log(8, 'Getting current stamina values');
                tempT = this.GetStatusNumbers(staminaDiv.text());
                temp = this.GetStatusNumbers(tempT.num + "/" + this.stats.stamina.max);
                if (temp && tempT) {
                    this.stats.stamina = temp;
                    this.stats.staminaT = tempT;
                } else {
                    utility.warn("Unable to get stamina values");
                    passed = false;
                }
            } else {
                utility.warn("Unable to get staminaDiv");
                passed = false;
            }

            // experience
            expDiv = ststbDiv.find("#app46755028429_st_2_5");
            if (expDiv.length) {
                utility.log(8, 'Getting current experience values');
                temp = this.GetStatusNumbers(expDiv.text());
                if (temp) {
                    this.stats.exp = temp;
                } else {
                    utility.warn("Unable to get experience values");
                    passed = false;
                }
            } else {
                utility.warn("Unable to get expDiv");
                passed = false;
            }

            // level
            levelDiv = ststbDiv.find("#app46755028429_st_5");
            if (levelDiv.length) {
                levelArray = levelDiv.text().match(/Level: ([0-9]+)!/);
                if (levelArray && levelArray.length === 2) {
                    utility.log(8, 'Getting current level');
                    newLevel = parseInt(levelArray[1], 10);
                    if (newLevel > this.stats.level) {
                        utility.log(2, 'New level. Resetting Best Land Cost.');
                        state.setItem('BestLandCost', 0);
                        state.setItem('KeepLevelUpGeneral', true);
                        this.stats.level = newLevel;
                    }
                } else {
                    utility.warn('levelArray incorrect');
                    passed = false;
                }
            } else {
                utility.warn("Unable to get levelDiv");
                passed = false;
            }

            // army
            armyDiv = bntpDiv.find("a[href*='army.php']");
            if (armyDiv.length) {
                armyArray = armyDiv.text().match(/My Army \(([0-9]+)\)/);
                if (armyArray && armyArray.length === 2) {
                    utility.log(8, 'Getting current army count');
                    this.stats.army.actual = parseInt(armyArray[1], 10);
                    temp = Math.min(this.stats.army.actual, 501);
                    if (temp >= 0 && temp <= 501) {
                        this.stats.army.capped = temp;
                    } else {
                        utility.warn("Army count not in limits");
                        passed = false;
                    }
                } else {
                    utility.warn('armyArray incorrect');
                    passed = false;
                }
            } else {
                utility.warn("Unable to get armyDiv");
                passed = false;
            }

            // upgrade points
            pointsDiv = bntpDiv.find("a[href*='keep.php']");
            if (pointsDiv.length) {
                pointsArray = pointsDiv.text().match(/My Stats \(\+([0-9]+)\)/);
                if (pointsArray && pointsArray.length === 2) {
                    utility.log(8, 'Getting current upgrade points');
                    newPoints = parseInt(pointsArray[1], 10);
                    if (newPoints > this.stats.points.skill) {
                        utility.log(2, 'New points. Resetting AutoStat.');
                        state.setItem("statsMatch", true);
                    }

                    this.stats.points.skill = newPoints;
                } else {
                    utility.log(8, 'No upgrade points found');
                    this.stats.points.skill = 0;
                }
            } else {
                utility.warn("Unable to get pointsDiv");
                passed = false;
            }

            // Indicators: Hours To Level, Time Remaining To Level and Expected Next Level
            if (this.stats.exp) {
                utility.log(8, 'Calculating time to next level');
                xS = gm.getItem("expStaminaRatio", 2.4, hiddenVar);
                xE = state.getItem('AutoQuest', this.newAutoQuest()).expRatio || gm.getItem("expEnergyRatio", 1.4, hiddenVar);
                this.stats.indicators.htl = ((this.stats.level * 12.5) - (this.stats.stamina.max * xS) - (this.stats.energy.max * xE)) / (12 * (xS + xE));
                this.stats.indicators.hrtl = (this.stats.exp.dif - (this.stats.stamina.num * xS) - (this.stats.energy.num * xE)) / (12 * (xS + xE));
                this.stats.indicators.enl = new Date().getTime() + Math.ceil(this.stats.indicators.hrtl * 60 * 60 * 1000);
            } else {
                utility.warn('Could not calculate time to next level. Missing experience stats!');
                passed = false;
            }

            if (!passed)  {
                utility.log(8, 'Saving stats');
                this.SaveStats();
            }

            if (!passed && this.stats.energy.max === 0 && this.stats.health.max === 0 && this.stats.stamina.max === 0) {
                utility.alert("<div style='text-align: center;'>Paused as this account may have been disabled!</div>", "Disabled");
                utility.warn("Paused as this account may have been disabled!", this.stats);
                this.PauseListener();
            }

            return passed;
        } catch (err) {
            utility.error("ERROR GetStats: " + err);
            return false;
        }
    },

    CheckResults_keep: function () {
        try {
            var rankImg        = null,
                warRankImg     = null,
                atlantisImg    = null,
                playerName     = null,
                moneyStored    = null,
                income         = null,
                upkeep         = null,
                energyPotions  = null,
                staminaPotions = null,
                otherStats     = null,
                guild          = null,
                energy         = null,
                stamina        = null,
                attack         = null,
                defense        = null,
                health         = null,
                statCont       = null,
                anotherEl      = null,
                tempText       = '',
                tempArr        = [];

            if ($(".keep_attribute_section").length) {
                utility.log(8, "Getting new values from player keep");
                // rank
                rankImg = $("img[src*='gif/rank']");
                if (rankImg.length) {
                    rankImg = rankImg.attr("src").split('/');
                    this.stats.rank.battle = parseInt((rankImg[rankImg.length - 1].match(/rank([0-9]+)\.gif/))[1], 10);
                } else {
                    utility.warn('Using stored rank.');
                }

                // PlayerName
                playerName = $(".keep_stat_title_inc");
                if (playerName.length) {
                    this.stats.PlayerName = playerName.text().match(new RegExp("\"(.+)\","))[1];
                    state.setItem("PlayerName", this.stats.PlayerName);
                } else {
                    utility.warn('Using stored PlayerName.');
                }

                if (this.stats.level >= 100) {
                    // war rank
                    warRankImg = $("img[src*='war_rank_']");
                    if (warRankImg.length) {
                        warRankImg = warRankImg.attr("src").split('/');
                        this.stats.rank.war = parseInt((warRankImg[warRankImg.length - 1].match(/war_rank_([0-9]+)\.gif/))[1], 10);
                    } else {
                        utility.warn('Using stored warRank.');
                    }
                }

                statCont = $(".attribute_stat_container");
                if (statCont.length === 6) {
                    // Energy
                    energy = statCont.eq(0);
                    if (energy.length) {
                        this.stats.energy = this.GetStatusNumbers(this.stats.energyT.num + '/' + parseInt(energy.text().match(new RegExp("\\s*([0-9]+).*"))[1], 10));
                    } else {
                        utility.warn('Using stored energy value.');
                    }

                    // Stamina
                    stamina = statCont.eq(1);
                    if (stamina.length) {
                        this.stats.stamina = this.GetStatusNumbers(this.stats.staminaT.num + '/' + parseInt(stamina.text().match(new RegExp("\\s*([0-9]+).*"))[1], 10));
                    } else {
                        utility.warn('Using stored stamina value.');
                    }

                    if (this.stats.level >= 10) {
                        // Attack
                        attack = statCont.eq(2);
                        if (attack.length) {
                            this.stats.attack = parseInt(attack.text().match(new RegExp("\\s*([0-9]+).*"))[1], 10);
                        } else {
                            utility.warn('Using stored attack value.');
                        }

                        // Defense
                        defense = statCont.eq(3);
                        if (defense.length) {
                            this.stats.defense = parseInt(defense.text().match(new RegExp("\\s*([0-9]+).*"))[1], 10);
                        } else {
                            utility.warn('Using stored defense value.');
                        }
                    }

                    // Health
                    health = statCont.eq(4);
                    if (health.length) {
                        this.stats.health = this.GetStatusNumbers(this.stats.healthT.num + '/' + parseInt(health.text().match(new RegExp("\\s*([0-9]+).*"))[1], 10));
                    } else {
                        utility.warn('Using stored health value.');
                    }
                } else {
                    utility.warn("Can't find stats containers! Using stored stats values.");
                }

                // Check for Gold Stored
                moneyStored = $(".statsTB .money");
                if (moneyStored.length) {
                    this.stats.gold.bank = utility.NumberOnly(moneyStored.text());
                    this.stats.gold.total = this.stats.gold.bank + this.stats.gold.cash;
                    moneyStored.attr({
                        title         : "Click to copy value to retrieve",
                        style         : "color: blue;"
                    }).hover(
                        function () {
                            this.style.cursor = 'pointer';
                        },
                        function () {
                            this.style.cursor = 'default';
                        }
                    ).click(function () {
                        $("input[name='get_gold']").val(caap.stats.gold.bank);
                    });
                } else {
                    utility.warn('Using stored inStore.');
                }

                // Check for income
                income = $(".statsTB .positive").eq(0);
                if (income.length) {
                    this.stats.gold.income = utility.NumberOnly(income.text());
                } else {
                    utility.warn('Using stored income.');
                }

                // Check for upkeep
                upkeep = $(".statsTB .negative");
                if (upkeep.length) {
                    this.stats.gold.upkeep = utility.NumberOnly(upkeep.text());
                } else {
                    utility.warn('Using stored upkeep.');
                }

                // Cash Flow
                this.stats.gold.flow = this.stats.gold.income - this.stats.gold.upkeep;

                // Energy potions
                energyPotions = $("img[title='Energy Potion']");
                if (energyPotions.length) {
                    this.stats.potions.energy = energyPotions.parent().next().text().replace(new RegExp("[^0-9\\.]", "g"), "");
                } else {
                    this.stats.potions.energy = 0;
                }

                // Guild
                /*
                guild = $("a[href*='guild.php?guild_id=']");
                if (guild.length) {
                    tempArr = guild.attr("href").match(/guild_id=(\d+_\d+)/);
                    if (tempArr && tempArr.length === 2) {
                        this.stats.guild.id = $.trim(tempArr[1]);
                    } else {
                        utility.log(2, "guild tempArr", tempArr);
                    }

                    tempText = $.trim(guild.parent().parent().text());
                    if (tempText) {
                        tempArr = tempText.match(new RegExp("(.*) \\((\\d+).*\\)"));
                        if (tempArr && tempArr.length === 3) {
                            this.stats.guild.name = $.trim(tempArr[1]);
                            this.stats.guild.members = parseInt(tempArr[2], 10);
                        } else {
                            utility.log(2, "guild tempArr", tempText, tempArr);
                        }
                    } else {
                        utility.log(2, "guild tempText", tempText);
                    }
                } else {
                    utility.warn('Using stored guild stats.');
                }
                */

                // Stamina potions
                staminaPotions = $("img[title='Stamina Potion']");
                if (staminaPotions.length) {
                    this.stats.potions.stamina = staminaPotions.parent().next().text().replace(new RegExp("[^0-9\\.]", "g"), "");
                } else {
                    this.stats.potions.stamina = 0;
                }

                // Other stats
                // Atlantis Open
                atlantisImg = utility.CheckForImage("seamonster_map_finished.jpg");
                if (atlantisImg) {
                    this.stats.other.atlantis = true;
                } else {
                    this.stats.other.atlantis = false;
                }

                // Quests Completed
                otherStats = $(".statsTB .keepTable1 tr:eq(0) td:last");
                if (otherStats.length) {
                    this.stats.other.qc = parseInt(otherStats.text(), 10);
                } else {
                    utility.warn('Using stored other.');
                }

                // Battles/Wars Won
                otherStats = $(".statsTB .keepTable1 tr:eq(1) td:last");
                if (otherStats.length) {
                    this.stats.other.bww = parseInt(otherStats.text(), 10);
                } else {
                    utility.warn('Using stored other.');
                }

                // Battles/Wars Lost
                otherStats = $(".statsTB .keepTable1 tr:eq(2) td:last");
                if (otherStats.length) {
                    this.stats.other.bwl = parseInt(otherStats.text(), 10);
                } else {
                    utility.warn('Using stored other.');
                }

                // Times eliminated
                otherStats = $(".statsTB .keepTable1 tr:eq(3) td:last");
                if (otherStats.length) {
                    this.stats.other.te = parseInt(otherStats.text(), 10);
                } else {
                    utility.warn('Using stored other.');
                }

                // Times you eliminated an enemy
                otherStats = $(".statsTB .keepTable1 tr:eq(4) td:last");
                if (otherStats.length) {
                    this.stats.other.tee = parseInt(otherStats.text(), 10);
                } else {
                    utility.warn('Using stored other.');
                }

                // Win/Loss Ratio (WLR)
                if (this.stats.other.bwl !== 0) {
                    this.stats.other.wlr = this.stats.other.bww / this.stats.other.bwl;
                } else {
                    this.stats.other.wlr = Infinity;
                }

                // Enemy Eliminated Ratio/Eliminated (EER)
                if (this.stats.other.tee !== 0) {
                    this.stats.other.eer = this.stats.other.tee / this.stats.other.te;
                } else {
                    this.stats.other.eer = Infinity;
                }

                // Indicators
                if (this.stats.level >= 10) {
                    this.stats.indicators.bsi = (this.stats.attack + this.stats.defense) / this.stats.level;
                    this.stats.indicators.lsi = (this.stats.energy.max + (2 * this.stats.stamina.max)) / this.stats.level;
                    this.stats.indicators.sppl = (this.stats.energy.max + (2 * this.stats.stamina.max) + this.stats.attack + this.stats.defense + this.stats.health.max - 122) / this.stats.level;
                    this.stats.indicators.api = (this.stats.attack + (this.stats.defense * 0.7));
                    this.stats.indicators.dpi = (this.stats.defense + (this.stats.attack * 0.7));
                    this.stats.indicators.mpi = ((this.stats.indicators.api + this.stats.indicators.dpi) / 2);
                }

                schedule.setItem("keep", gm.getItem("CheckKeep", 1, hiddenVar) * 3600, 300);
                this.SaveStats();
            } else {
                anotherEl = $("a[href*='keep.php?user=']");
                if (anotherEl && anotherEl.length) {
                    utility.log(2, "On another player's keep", anotherEl.attr("href").match(/user=([0-9]+)/)[1]);
                } else {
                    utility.warn("Attribute section not found and not identified as another player's keep!");
                }
            }

            if (config.getItem("enableTitles", true)) {
                spreadsheet.doTitles();
            }

            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults_keep: " + err);
            return false;
        }
    },

    CheckResults_oracle: function () {
        try {
            var favorDiv = null,
                text     = '',
                temp     = [],
                save     = false;

            favorDiv = $(".title_action");
            if (favorDiv.length) {
                text = favorDiv.text();
                temp = text.match(new RegExp("\\s*You have zero favor points!\\s*"));
                if (temp && temp.length === 1) {
                    utility.log(2, 'Got number of Favor Points.');
                    this.stats.points.favor = 0;
                    save = true;
                } else {
                    temp = text.match(new RegExp("\\s*You have a favor point!\\s*"));
                    if (temp && temp.length === 1) {
                        utility.log(2, 'Got number of Favor Points.');
                        this.stats.points.favor = 1;
                        save = true;
                    } else {
                        temp = text.match(new RegExp("\\s*You have ([0-9]+) favor points!\\s*"));
                        if (temp && temp.length === 2) {
                            utility.log(2, 'Got number of Favor Points.');
                            this.stats.points.favor = parseInt(temp[1], 10);
                            save = true;
                        } else {
                            utility.warn('Favor Points RegExp not matched.');
                        }
                    }
                }
            } else {
                utility.warn('Favor Points div not found.');
            }

            if (save) {
                this.SaveStats();
            }

            schedule.setItem("oracle", gm.getItem("CheckOracle", 24, hiddenVar) * 3600, 300);
            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults_oracle: " + err);
            return false;
        }
    },

    CheckResults_alchemy: function () {
        try {
            if (config.getItem("enableTitles", true)) {
                spreadsheet.doTitles();
            }

            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults_alchemy: " + err);
            return false;
        }
    },

    CheckResults_soldiers: function () {
        try {
            $("div[class='eq_buy_costs_int']").find("select[name='amount']:first option[value='5']").attr('selected', 'selected');
            if (config.getItem("enableTitles", true)) {
                spreadsheet.doTitles();
            }

            town.GetItems("soldiers");
            schedule.setItem("soldiers", gm.getItem("CheckSoldiers", 72, hiddenVar) * 3600, 300);
            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults_soldiers: " + err);
            return false;
        }
    },

    CheckResults_item: function () {
        try {
            $("div[class='eq_buy_costs_int']").find("select[name='amount']:first option[value='5']").attr('selected', 'selected');
            if (config.getItem("enableTitles", true)) {
                spreadsheet.doTitles();
            }

            town.GetItems("item");
            schedule.setItem("item", gm.getItem("CheckItem", 72, hiddenVar) * 3600, 300);
            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults_item: " + err);
            return false;
        }
    },

    CheckResults_magic: function () {
        try {
            $("div[class='eq_buy_costs_int']").find("select[name='amount']:first option[value='5']").attr('selected', 'selected');
            if (config.getItem("enableTitles", true)) {
                spreadsheet.doTitles();
            }

            town.GetItems("magic");
            schedule.setItem("magic", gm.getItem("CheckMagic", 72, hiddenVar) * 3600, 300);
            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults_magic: " + err);
            return false;
        }
    },

    CheckResults_goblin_emp: function () {
        try {
            if (config.getItem("goblinHinting", true)) {
                spreadsheet.doTitles(true);
            }

            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults_goblin_emp: " + err);
            return false;
        }
    },

    CheckResults_gift: function () {
        try {
            gifting.gifts.populate();
            schedule.setItem("gift", gm.getItem("CheckGift", 72, hiddenVar) * 3600, 300);
            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults_gift: " + err);
            return false;
        }
    },

    CheckResults_battlerank: function () {
        try {
            var rankDiv = null,
                text     = '',
                temp     = [];

            rankDiv = $("div[style*='battle_rank_banner.jpg']");
            if (rankDiv.length) {
                text = rankDiv.text();
                temp = text.match(new RegExp(".*with (.*) Battle Points.*"));
                if (temp && temp.length === 2) {
                    utility.log(2, 'Got Battle Rank Points.');
                    this.stats.rank.battlePoints = utility.NumberOnly(temp[1]);
                    this.SaveStats();
                } else {
                    utility.warn('Battle Rank Points RegExp not matched.');
                }
            } else {
                utility.warn('Battle Rank Points div not found.');
            }

            schedule.setItem("battlerank", gm.getItem("CheckBattleRank", 48, hiddenVar) * 3600, 300);
            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults_battlerank: " + err);
            return false;
        }
    },

    CheckResults_war_rank: function () {
        try {
            var rankDiv = null,
                text     = '',
                temp     = [];

            rankDiv = $("div[style*='war_rank_banner.jpg']");
            if (rankDiv.length) {
                text = rankDiv.text();
                temp = text.match(new RegExp(".*with (.*) War Points.*"));
                if (temp && temp.length === 2) {
                    utility.log(2, 'Got War Rank Points.');
                    this.stats.rank.warPoints = utility.NumberOnly(temp[1]);
                    this.SaveStats();
                } else {
                    utility.warn('War Rank Points RegExp not matched.');
                }
            } else {
                utility.warn('War Rank Points div not found.');
            }

            schedule.setItem("warrank", gm.getItem("CheckWarRank", 48, hiddenVar) * 3600, 300);
            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults_war_rank: " + err);
            return false;
        }
    },

    CheckResults_achievements: function () {
        try {
            var achDiv = null,
                tdDiv  = null;

            achDiv = $("#app46755028429_achievements_2");
            if (achDiv && achDiv.length) {
                tdDiv = achDiv.find("td div");
                if (tdDiv && tdDiv.length === 6) {
                    this.stats.achievements.battle.invasions.won = utility.NumberOnly(tdDiv.eq(0).text());
                    this.stats.achievements.battle.duels.won = utility.NumberOnly(tdDiv.eq(1).text());
                    this.stats.achievements.battle.invasions.lost = utility.NumberOnly(tdDiv.eq(2).text());
                    this.stats.achievements.battle.duels.lost = utility.NumberOnly(tdDiv.eq(3).text());
                    this.stats.achievements.battle.invasions.streak = parseInt(tdDiv.eq(4).text(), 10);
                    this.stats.achievements.battle.duels.streak = parseInt(tdDiv.eq(5).text(), 10);
                    if (this.stats.achievements.battle.invasions.lost) {
                        this.stats.achievements.battle.invasions.ratio = this.stats.achievements.battle.invasions.won / this.stats.achievements.battle.invasions.lost;
                    } else {
                        this.stats.achievements.battle.invasions.ratio = Infinity;
                    }

                    if (this.stats.achievements.battle.invasions.lost) {
                        this.stats.achievements.battle.duels.ratio = this.stats.achievements.battle.duels.won / this.stats.achievements.battle.duels.lost;
                    } else {
                        this.stats.achievements.battle.duels.ratio = Infinity;
                    }
                } else {
                    utility.warn('Battle Achievements problem.');
                }
            } else {
                utility.warn('Battle Achievements not found.');
            }

            achDiv = $("#app46755028429_achievements_3");
            if (achDiv && achDiv.length) {
                tdDiv = achDiv.find("td div");
                if (tdDiv && tdDiv.length === 13) {
                    this.stats.achievements.monster.gildamesh = utility.NumberOnly(tdDiv.eq(0).text());
                    this.stats.achievements.monster.lotus = utility.NumberOnly(tdDiv.eq(1).text());
                    this.stats.achievements.monster.colossus = utility.NumberOnly(tdDiv.eq(2).text());
                    this.stats.achievements.monster.dragons = utility.NumberOnly(tdDiv.eq(3).text());
                    this.stats.achievements.monster.sylvanas = utility.NumberOnly(tdDiv.eq(4).text());
                    this.stats.achievements.monster.cronus = utility.NumberOnly(tdDiv.eq(5).text());
                    this.stats.achievements.monster.keira = utility.NumberOnly(tdDiv.eq(6).text());
                    this.stats.achievements.monster.sieges = utility.NumberOnly(tdDiv.eq(7).text());
                    this.stats.achievements.monster.legion = utility.NumberOnly(tdDiv.eq(8).text());
                    this.stats.achievements.monster.genesis = utility.NumberOnly(tdDiv.eq(9).text());
                    this.stats.achievements.monster.skaar = utility.NumberOnly(tdDiv.eq(10).text());
                    this.stats.achievements.monster.gehenna = utility.NumberOnly(tdDiv.eq(11).text());
                    this.stats.achievements.monster.aurelius = utility.NumberOnly(tdDiv.eq(12).text());
                } else {
                    utility.warn('Monster Achievements problem.');
                }
            } else {
                utility.warn('Monster Achievements not found.');
            }

            achDiv = $("#app46755028429_achievements_4");
            if (achDiv && achDiv.length) {
                tdDiv = achDiv.find("td div");
                if (tdDiv && tdDiv.length === 1) {
                    this.stats.achievements.other.alchemy = utility.NumberOnly(tdDiv.eq(0).text());
                } else {
                    utility.warn('Other Achievements problem.');
                }

                this.SaveStats();
            } else {
                utility.warn('Other Achievements not found.');
            }

            schedule.setItem("achievements", gm.getItem("CheckAchievements", 72, hiddenVar) * 3600, 300);
            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults_achievements: " + err);
            return false;
        }
    },

    CheckResults_view_class_progress: function () {
        try {
            var classDiv = null,
                name     = '';

            classDiv = $("#app46755028429_choose_class_screen div[class*='banner_']");
            if (classDiv && classDiv.length === 6) {
                classDiv.each(function (index) {
                    name = $(this).attr("class").replace("banner_", '');
                    if (name && $.isPlainObject(caap.stats.character[name])) {
                        caap.stats.character[name].percent = utility.getElementWidth($(this).find("img[src*='progress']").eq(0));
                        caap.stats.character[name].level = utility.NumberOnly($(this).children().eq(2).text());
                        utility.log(2, "Got character class record", name, caap.stats.character[name]);
                    } else {
                        utility.warn("Problem character class name", name);
                    }
                });

                this.SaveStats();
            } else {
                utility.warn("Problem with character class records", classDiv);
            }

            schedule.setItem("view_class_progress", gm.getItem("CheckClassProgress", 48, hiddenVar) * 3600, 300);
            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults_view_class_progress: " + err);
            return false;
        }
    },

    /////////////////////////////////////////////////////////////////////
    //                          QUESTING
    // Quest function does action, DrawQuest sets up the page and gathers info
    /////////////////////////////////////////////////////////////////////

    MaxEnergyQuest: function () {
        var maxIdleEnergy = this.stats.energy.max,
            theGeneral = config.getItem('IdleGeneral', 'Use Current');

        if (theGeneral !== 'Use Current') {
            maxIdleEnergy = general.GetEnergyMax(theGeneral);
        }

        if (theGeneral !== 'Use Current' && !maxIdleEnergy) {
            utility.log(2, "Changing to idle general to get Max energy");
            if (general.Select('IdleGeneral')) {
                return true;
            }
        }

        if (this.stats.energy.num >= maxIdleEnergy) {
            return this.Quests();
        }

        return false;
    },

    QuestAreaInfo: {
        'Land of Fire' : {
            clas : 'quests_stage_1',
            base : 'land_fire',
            next : 'Land of Earth',
            area : '',
            list : '',
            boss : 'Heart of Fire',
            orb  : 'Orb of Gildamesh'
        },
        'Land of Earth' : {
            clas : 'quests_stage_2',
            base : 'land_earth',
            next : 'Land of Mist',
            area : '',
            list : '',
            boss : 'Gift of Earth',
            orb  : 'Colossal Orb'
        },
        'Land of Mist' : {
            clas : 'quests_stage_3',
            base : 'land_mist',
            next : 'Land of Water',
            area : '',
            list : '',
            boss : 'Eye of the Storm',
            orb  : 'Sylvanas Orb'
        },
        'Land of Water' : {
            clas : 'quests_stage_4',
            base : 'land_water',
            next : 'Demon Realm',
            area : '',
            list : '',
            boss : 'A Look into the Darkness',
            orb  : 'Orb of Mephistopheles'
        },
        'Demon Realm' : {
            clas : 'quests_stage_5',
            base : 'land_demon_realm',
            next : 'Undead Realm',
            area : '',
            list : '',
            boss : 'The Rift',
            orb  : 'Orb of Keira'
        },
        'Undead Realm' : {
            clas : 'quests_stage_6',
            base : 'land_undead_realm',
            next : 'Underworld',
            area : '',
            list : '',
            boss : 'Undead Embrace',
            orb  : 'Lotus Orb'
        },
        'Underworld' : {
            clas : 'quests_stage_7',
            base : 'tab_underworld',
            next : 'Kingdom of Heaven',
            area : '',
            list : '',
            boss : 'Confrontation',
            orb  : 'Orb of Skaar Deathrune'
        },
        'Kingdom of Heaven' : {
            clas : 'quests_stage_8',
            base : 'tab_heaven',
            next : 'Ivory City',
            area : '',
            list : '',
            boss : 'Archangels Wrath',
            orb  : 'Orb of Azriel'
        },
        'Ivory City' : {
            clas : 'quests_stage_9',
            base : 'tab_ivory',
            next : 'Earth II',
            area : '',
            list : '',
            boss : 'Entrance to the Throne',
            orb  : 'Orb of Alpha Mephistopheles'
        },
        'Earth II' : {
            clas : 'quests_stage_10',
            base : 'tab_earth2',
            next : 'Ambrosia',
            area : 'Demi Quests',
            list : 'demiQuestList',
            boss : "Lion's Rebellion",
            orb  : 'Orb of Aurelius'
        },
        'Ambrosia' : {
            clas : 'symbolquests_stage_1',
            next : 'Malekus',
            area : '',
            list : ''
        },
        'Malekus' : {
            clas : 'symbolquests_stage_2',
            next : 'Corvintheus',
            area : '',
            list : ''
        },
        'Corvintheus' : {
            clas : 'symbolquests_stage_3',
            next : 'Aurora',
            area : '',
            list : ''
        },
        'Aurora' : {
            clas : 'symbolquests_stage_4',
            next : 'Azeron',
            area : '',
            list : ''
        },
        'Azeron' : {
            clas : 'symbolquests_stage_5',
            next : 'Atlantis',
            area : 'Atlantis',
            list : 'atlantisQuestList'
        },
        'Atlantis' : {
            clas : 'monster_quests_stage_1',
            next : '',
            area : '',
            list : ''
        }
    },

    demiQuestTable : {
        'Ambrosia'    : 'energy',
        'Malekus'     : 'attack',
        'Corvintheus' : 'defense',
        'Aurora'      : 'health',
        'Azeron'      : 'stamina'
    },

    Quests: function () {
        try {
            var storeRetrieve = state.getItem('storeRetrieve', '');
            if (storeRetrieve) {
                if (storeRetrieve === 'general') {
                    if (general.Select('BuyGeneral')) {
                        return true;
                    }

                    state.setItem('storeRetrieve', '');
                    return true;
                } else {
                    return this.RetrieveFromBank(storeRetrieve);
                }
            }

            this.SetDivContent('quest_mess', '');
            var whenQuest = config.getItem('WhenQuest', 'Never');
            if (whenQuest === 'Never') {
                this.SetDivContent('quest_mess', 'Questing off');
                return false;
            }

            if (whenQuest === 'Not Fortifying' || (config.getItem('PrioritiseMonsterAfterLvl', false) && state.getItem('KeepLevelUpGeneral', false))) {
                var fortMon = state.getItem('targetFromfortify', {});
                if ($.isPlainObject(fortMon) && fortMon.name && fortMon.type) {
                    switch (fortMon.type) {
                    case "Fortify":
                        var maxHealthtoQuest = config.getItem('MaxHealthtoQuest', 0);
                        if (!maxHealthtoQuest) {
                            this.SetDivContent('quest_mess', '<span style="font-weight: bold;">No valid over fortify %</span>');
                            return false;
                        }

                        this.SetDivContent('quest_mess', 'No questing until attack target ' + fortMon.name + " health exceeds " + config.getItem('MaxToFortify', 0) + '%');
                        var targetFrombattle_monster = state.getItem('targetFrombattle_monster', '');
                        if (!targetFrombattle_monster) {
                            var currentMonster = monster.getItem(targetFrombattle_monster);
                            if (!currentMonster.fortify) {
                                if (currentMonster.fortify < maxHealthtoQuest) {
                                    this.SetDivContent('quest_mess', 'No questing until fortify target ' + targetFrombattle_monster + ' health exceeds ' + maxHealthtoQuest + '%');
                                    return false;
                                }
                            }
                        }

                        break;
                    case "Strengthen":
                        this.SetDivContent('quest_mess', 'No questing until attack target ' + fortMon.name + " at full strength.");
                        break;
                    case "Stun":
                        this.SetDivContent('quest_mess', 'No questing until attack target ' + fortMon.name + " stunned.");
                        break;
                    default:
                    }

                    return false;
                }
            }

            if (!state.getItem('AutoQuest', this.newAutoQuest()).name) {
                if (config.getItem('WhyQuest', 'Manual') === 'Manual') {
                    this.SetDivContent('quest_mess', 'Pick quest manually.');
                    return false;
                }

                this.SetDivContent('quest_mess', 'Searching for quest.');
                utility.log(1, "Searching for quest");
            } else {
                var energyCheck = this.CheckEnergy(state.getItem('AutoQuest', this.newAutoQuest()).energy, whenQuest, 'quest_mess');
                if (!energyCheck) {
                    return false;
                }
            }

            if (state.getItem('AutoQuest', this.newAutoQuest()).general === 'none' || config.getItem('ForceSubGeneral', false)) {
                if (general.Select('SubQuestGeneral')) {
                    return true;
                }
            } else if (general.LevelUpCheck('QuestGeneral')) {
                if (general.Select('LevelUpGeneral')) {
                    return true;
                }

                utility.log(2, 'Using level up general');
            }

            switch (config.getItem('QuestArea', 'Quest')) {
            case 'Quest' :
                var imgExist = false;
                if (this.stats.level > 7) {
                    var subQArea = config.getItem('QuestSubArea', 'Land of Fire');
                    var landPic = this.QuestAreaInfo[subQArea].base;
                    if (landPic === 'tab_heaven' || config.getItem('GetOrbs', false) && config.getItem('WhyQuest', 'Manual') !== 'Manual') {
                        if (this.CheckMagic()) {
                            return true;
                        }
                    }

                    if (landPic === 'tab_underworld' || landPic === 'tab_ivory' || landPic === 'tab_earth2') {
                        imgExist = utility.NavigateTo('quests,jobs_tab_more.gif,' + landPic + '_small.gif', landPic + '_big');
                    } else if (landPic === 'tab_heaven') {
                        imgExist = utility.NavigateTo('quests,jobs_tab_more.gif,' + landPic + '_small2.gif', landPic + '_big2.gif');
                    } else if ((landPic === 'land_demon_realm') || (landPic === 'land_undead_realm')) {
                        imgExist = utility.NavigateTo('quests,jobs_tab_more.gif,' + landPic + '.gif', landPic + '_sel');
                    } else {
                        imgExist = utility.NavigateTo('quests,jobs_tab_back.gif,' + landPic + '.gif', landPic + '_sel');
                    }
                } else {
                    imgExist = utility.NavigateTo('quests', 'quest_back_1.jpg');
                }

                if (imgExist) {
                    return true;
                }

                break;
            case 'Demi Quests' :
                if (utility.NavigateTo('quests,symbolquests', 'demi_quest_on.gif')) {
                    return true;
                }

                var subDQArea = config.getItem('QuestSubArea', 'Ambrosia');
                var picSlice = nHtml.FindByAttrContains(document.body, 'img', 'src', 'deity_' + this.demiQuestTable[subDQArea]);
                if (picSlice.style.height !== '160px') {
                    return utility.NavigateTo('deity_' + this.demiQuestTable[subDQArea]);
                }

                break;
            case 'Atlantis' :
                if (!utility.CheckForImage('tab_atlantis_on.gif')) {
                    return utility.NavigateTo('quests,monster_quests');
                }

                break;
            default :
            }

            var button = utility.CheckForImage('quick_switch_button.gif');
            if (button && !config.getItem('ForceSubGeneral', false)) {
                utility.log(2, 'Clicking on quick switch general button.');
                utility.Click(button);
                general.quickSwitch = true;
                return true;
            }

            if (general.quickSwitch) {
                general.GetEquippedStats();
            }

            var costToBuy = '';
            //Buy quest requires popup
            var itemBuyPopUp = nHtml.FindByAttrContains(document.body, "form", "id", 'itemBuy');
            if (itemBuyPopUp) {
                state.setItem('storeRetrieve', 'general');
                if (general.Select('BuyGeneral')) {
                    return true;
                }

                state.setItem('storeRetrieve', '');
                costToBuy = itemBuyPopUp.textContent.replace(new RegExp(".*\\$"), '').replace(new RegExp("[^0-9]{3,}.*"), '');
                utility.log(2, "costToBuy", costToBuy);
                if (this.stats.gold.cash < costToBuy) {
                    //Retrieving from Bank
                    if (this.stats.gold.cash + (this.stats.gold.bank - config.getItem('minInStore', 0)) >= costToBuy) {
                        utility.log(1, "Trying to retrieve", costToBuy - this.stats.gold.cash);
                        state.setItem("storeRetrieve", costToBuy - this.stats.gold.cash);
                        return this.RetrieveFromBank(costToBuy - this.stats.gold.cash);
                    } else {
                        utility.log(1, "Cant buy requires, stopping quest");
                        this.ManualAutoQuest();
                        return false;
                    }
                }

                button = utility.CheckForImage('quick_buy_button.jpg');
                if (button) {
                    utility.log(1, 'Clicking on quick buy button.');
                    utility.Click(button);
                    return true;
                }

                utility.warn("Cant find buy button");
                return false;
            }

            button = utility.CheckForImage('quick_buy_button.jpg');
            if (button) {
                state.setItem('storeRetrieve', 'general');
                if (general.Select('BuyGeneral')) {
                    return true;
                }

                state.setItem('storeRetrieve', '');
                costToBuy = button.previousElementSibling.previousElementSibling.previousElementSibling
                    .previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling
                    .firstChild.data.replace(new RegExp("[^0-9]", "g"), '');
                utility.log(2, "costToBuy", costToBuy);
                if (this.stats.gold.cash < costToBuy) {
                    //Retrieving from Bank
                    if (this.stats.gold.cash + (this.stats.gold.bank - config.getItem('minInStore', 0)) >= costToBuy) {
                        utility.log(1, "Trying to retrieve: ", costToBuy - this.stats.gold.cash);
                        state.setItem("storeRetrieve", costToBuy - this.stats.gold.cash);
                        return this.RetrieveFromBank(costToBuy - this.stats.gold.cash);
                    } else {
                        utility.log(1, "Cant buy General, stopping quest");
                        this.ManualAutoQuest();
                        return false;
                    }
                }

                utility.log(2, 'Clicking on quick buy general button.');
                utility.Click(button);
                return true;
            }

            var autoQuestDivs = this.CheckResults_quests(true);
            if (!state.getItem('AutoQuest', this.newAutoQuest()).name) {
                utility.log(1, 'Could not find AutoQuest.');
                this.SetDivContent('quest_mess', 'Could not find AutoQuest.');
                return false;
            }

            var autoQuestName = state.getItem('AutoQuest', this.newAutoQuest()).name;
            if (state.getItem('AutoQuest', this.newAutoQuest()).name !== autoQuestName) {
                utility.log(1, 'New AutoQuest found.');
                this.SetDivContent('quest_mess', 'New AutoQuest found.');
                return true;
            }

            // if found missing requires, click to buy
            if (autoQuestDivs.tr !== undefined) {
                if (config.getItem('QuestSubArea', 'Atlantis') === 'Atlantis') {
                    utility.log(1, "Cant buy Atlantis items, stopping quest");
                    this.ManualAutoQuest();
                    return false;
                }

                var background = nHtml.FindByAttrContains(autoQuestDivs.tr, "div", "style", 'background-color');
                if (background) {
                    if (background.style.backgroundColor === 'rgb(158, 11, 15)') {
                        utility.log(3, " background.style.backgroundColor", background.style.backgroundColor);
                        state.setItem('storeRetrieve', 'general');
                        if (general.Select('BuyGeneral')) {
                            return true;
                        }

                        state.setItem('storeRetrieve', '');
                        if (background.firstChild.firstChild.title) {
                            utility.log(2, "Clicking to buy", background.firstChild.firstChild.title);
                            utility.Click(background.firstChild.firstChild);
                            return true;
                        }
                    }
                }
            } else {
                utility.warn('Can not buy quest item');
                return false;
            }

            var questGeneral = state.getItem('AutoQuest', this.newAutoQuest()).general;
            if (questGeneral === 'none' || config.getItem('ForceSubGeneral', false)) {
                if (general.Select('SubQuestGeneral')) {
                    return true;
                }
            } else if (questGeneral && questGeneral !== general.GetCurrent()) {
                if (general.LevelUpCheck("QuestGeneral")) {
                    if (general.Select('LevelUpGeneral')) {
                        return true;
                    }

                    utility.log(2, 'Using level up general');
                } else {
                    if (autoQuestDivs.genDiv !== undefined) {
                        utility.log(2, 'Clicking on general', questGeneral);
                        utility.Click(autoQuestDivs.genDiv);
                        return true;
                    } else {
                        utility.warn('Can not click on general', questGeneral);
                        return false;
                    }
                }
            }

            if (autoQuestDivs.click !== undefined) {
                utility.log(2, 'Clicking auto quest', autoQuestName);
                state.setItem('ReleaseControl', true);
                utility.Click(autoQuestDivs.click);
                this.ShowAutoQuest();
                if (autoQuestDivs.orbCheck) {
                    schedule.setItem("magic", 0);
                }

                return true;
            } else {
                utility.warn('Can not click auto quest', autoQuestName);
                return false;
            }
        } catch (err) {
            utility.error("ERROR in Quests: " + err);
            return false;
        }
    },

    questName: null,

    CheckResults_symbolquests: function () {
        try {
            var demiDiv = null,
                points  = [],
                success = true;

            demiDiv = $("div[id*='app46755028429_symbol_desc_symbolquests']");
            if (demiDiv && demiDiv.length === 5) {
                demiDiv.each(function (index) {
                    var temp = utility.NumberOnly($(this).children().next().eq(1).children().children().next().text());
                    if (utility.isNum(temp)) {
                        points.push(temp);
                    } else {
                        success = false;
                        utility.warn('Demi-Power temp text problem', temp);
                    }
                });

                utility.log(3, 'Points', points);
                if (success) {
                    this.demi.ambrosia.power.total = points[0];
                    this.demi.malekus.power.total = points[1];
                    this.demi.corvintheus.power.total = points[2];
                    this.demi.aurora.power.total = points[3];
                    this.demi.azeron.power.total = points[4];
                    schedule.setItem("symbolquests", gm.getItem("CheckSymbolQuests", 24, hiddenVar) * 3600, 300);
                    this.SaveDemi();
                }
            } else {
                utility.warn("Demi demiDiv problem", demiDiv);
            }

            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults_symbolquests: " + err);
            return false;
        }
    },

    isBossQuest: function (name) {
        try {
            var qn = '',
                found = false;

            for (qn in this.QuestAreaInfo) {
                if (this.QuestAreaInfo.hasOwnProperty(qn)) {
                    if (this.QuestAreaInfo[qn].boss && this.QuestAreaInfo[qn].boss === name) {
                        found = true;
                        break;
                    }
                }
            }

            return found;
        } catch (err) {
            utility.error("ERROR in isBossQuest: " + err);
            return false;
        }
    },

    CheckResults_quests: function (pickQuestTF) {
        try {
            if ($("#app46755028429_quest_map_container").length) {
                var metaQuest = $("div[id*='app46755028429_meta_quest_']");
                if (metaQuest && metaQuest.length) {
                    metaQuest.each(function (index) {
                        if (!($(this).find("img[src*='_completed']").length || $(this).find("img[src*='_locked']").length)) {
                            $("div[id='app46755028429_quest_wrapper_" + $(this).attr("id").replace("app46755028429_meta_quest_", '') + "']").css("display", "block");
                        }
                    });
                }
            }

            if (config.getItem("enableTitles", true)) {
                spreadsheet.doTitles();
            }

            var whyQuest = config.getItem('WhyQuest', 'Manual');
            if (pickQuestTF === true && whyQuest !== 'Manual') {
                state.setItem('AutoQuest', this.newAutoQuest());
            }

            var bestReward  = 0,
                rewardRatio = 0,
                div         = document.body,
                ss          = null,
                s           = 0,
                len         = 0;

            if (utility.CheckForImage('demi_quest_on.gif')) {
                this.CheckResults_symbolquests();
                ss = document.evaluate(".//div[contains(@id,'symbol_displaysymbolquest')]",
                    div, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                if (ss.snapshotLength <= 0) {
                    utility.warn("Failed to find symbol_displaysymbolquest");
                }

                for (s = 0, len = ss.snapshotLength; s < len; s += 1) {
                    div = ss.snapshotItem(s);
                    if (div.style.display !== 'none') {
                        break;
                    }
                }
            }

            ss = document.evaluate(".//div[contains(@class,'quests_background')]", div, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            if (ss.snapshotLength <= 0) {
                utility.warn("Failed to find quests_background");
                return false;
            }

            var haveOrb      = false,
                isTheArea    = false,
                questSubArea = '';

            questSubArea = config.getItem('QuestSubArea', 'Land of Fire');
            isTheArea = this.CheckCurrentQuestArea(questSubArea);
            utility.log(2, "Is quest area", questSubArea, isTheArea);
            if (isTheArea && whyQuest !== 'Manual' && config.getItem('GetOrbs', false)) {
                if ($("input[alt='Perform Alchemy']").length) {
                    haveOrb = true;
                } else {
                    if (questSubArea && this.QuestAreaInfo[questSubArea].orb) {
                        haveOrb = town.haveOrb(this.QuestAreaInfo[questSubArea].orb);
                    }
                }

                utility.log(2, "Have Orb for", questSubArea, haveOrb);
                if (haveOrb && this.isBossQuest(state.getItem('AutoQuest', this.newAutoQuest()).name)) {
                    state.setItem('AutoQuest', this.newAutoQuest());
                }
            }

            var autoQuestDivs = {
                click    : undefined,
                tr       : undefined,
                genDiv   : undefined,
                orbCheck : false
            };

            $("div[class='autoquest']").remove();
            var expRegExp       = new RegExp("\\+([0-9]+)"),
                energyRegExp    = new RegExp("([0-9]+)\\s+energy", "i"),
                moneyRegExp     = new RegExp("\\$([0-9,]+)\\s*-\\s*\\$([0-9,]+)", "i"),
                money2RegExp    = new RegExp("\\$([0-9,]+)mil\\s*-\\s*\\$([0-9,]+)mil", "i"),
                influenceRegExp = new RegExp("([0-9]+)%");

            for (s = 0, len = ss.snapshotLength; s < len; s += 1) {
                div = ss.snapshotItem(s);
                this.questName = this.GetQuestName(div);
                if (!this.questName) {
                    continue;
                }

                var reward     = null,
                    energy     = null,
                    experience = null,
                    divTxt     = nHtml.GetText(div),
                    expM       = divTxt.match(expRegExp);

                if (expM && expM.length === 2) {
                    experience = utility.NumberOnly(expM[1]);
                } else {
                    var expObj = $("div[class='quest_experience']");
                    if (expObj && expObj.length) {
                        experience = utility.NumberOnly(expObj.text());
                    } else {
                        utility.warn("Can't find experience for", this.questName);
                    }
                }

                var idx = this.questName.indexOf('<br>');
                if (idx >= 0) {
                    this.questName = this.questName.substring(0, idx);
                }

                var energyM = divTxt.match(energyRegExp);
                if (energyM && energyM.length === 2) {
                    energy = utility.NumberOnly(energyM[1]);
                } else {
                    var eObj = nHtml.FindByAttrContains(div, 'div', 'className', 'quest_req');
                    if (eObj) {
                        energy = eObj.getElementsByTagName('b')[0];
                    }
                }

                if (!energy) {
                    utility.warn("Can't find energy for", this.questName);
                    continue;
                }

                var moneyM     = utility.RemoveHtmlJunk(divTxt).match(moneyRegExp),
                    rewardLow  = 0,
                    rewardHigh = 0;

                if (moneyM && moneyM.length === 3) {
                    rewardLow  = utility.NumberOnly(moneyM[1]);
                    rewardHigh = utility.NumberOnly(moneyM[2]);
                    reward = (rewardLow + rewardHigh) / 2;
                } else {
                    moneyM = utility.RemoveHtmlJunk(divTxt).match(money2RegExp);
                    if (moneyM && moneyM.length === 3) {
                        rewardLow  = utility.NumberOnly(moneyM[1]) * 1000000;
                        rewardHigh = utility.NumberOnly(moneyM[2]) * 1000000;
                        reward = (rewardLow + rewardHigh) / 2;
                    } else {
                        utility.warn('No money found for', this.questName, divTxt);
                    }
                }

                var click = $(div).find("input[name*='Do']");
                if (click && click.length) {
                    click = click.get(0);
                } else {
                    utility.warn('No button found for', this.questName);
                    continue;
                }

                var influence = null;
                if (this.isBossQuest(this.questName)) {
                    if ($("div[class='quests_background_sub']").length) {
                        //if boss and found sub quests
                        influence = "100";
                    } else {
                        influence = "0";
                    }
                } else {
                    var influenceList = divTxt.match(influenceRegExp);
                    if (influenceList && influenceList.length === 2) {
                        influence = influenceList[1];
                    } else {
                        utility.warn("Influence div not found.", influenceList);
                    }
                }

                if (!influence) {
                    utility.warn('No influence found for', this.questName, divTxt);
                }

                var general = 'none';
                var genDiv = null;
                if (influence && influence < 100) {
                    genDiv = nHtml.FindByAttrContains(div, 'div', 'className', 'quest_act_gen');
                    if (genDiv) {
                        genDiv = nHtml.FindByAttrContains(genDiv, 'img', 'src', 'jpg');
                        if (genDiv) {
                            general = genDiv.title;
                        }
                    }
                }

                var questType = 'subquest';
                if (div.className === 'quests_background') {
                    questType = 'primary';
                } else if (div.className === 'quests_background_special') {
                    questType = 'boss';
                }

                if (s === 0) {
                    utility.log(3, "Adding Quest Labels and Listeners");
                }

                this.LabelQuests(div, energy, reward, experience, click);
                utility.log(9, "QuestSubArea", questSubArea);
                if (isTheArea) {
                    if (config.getItem('GetOrbs', false) && questType === 'boss' && whyQuest !== 'Manual' && !haveOrb) {
                        this.updateAutoQuest('name', this.questName);
                        pickQuestTF = true;
                        autoQuestDivs.orbCheck = true;
                    }

                    switch (whyQuest) {
                    case 'Advancement' :
                        if (influence) {
                            if (!state.getItem('AutoQuest', this.newAutoQuest()).name && questType === 'primary' && utility.NumberOnly(influence) < 100) {
                                this.updateAutoQuest('name', this.questName);
                                pickQuestTF = true;
                            }
                        } else {
                            utility.warn("Can't find influence for", this.questName, influence);
                        }

                        break;
                    case 'Max Influence' :
                        if (influence) {
                            if (!state.getItem('AutoQuest', this.newAutoQuest()).name && utility.NumberOnly(influence) < 100) {
                                this.updateAutoQuest('name', this.questName);
                                pickQuestTF = true;
                            }
                        } else {
                            utility.warn("Can't find influence for", this.questName, influence);
                        }

                        break;
                    case 'Max Experience' :
                        rewardRatio = (Math.floor(experience / energy * 100) / 100);
                        if (bestReward < rewardRatio) {
                            this.updateAutoQuest('name', this.questName);
                            pickQuestTF = true;
                        }

                        break;
                    case 'Max Gold' :
                        rewardRatio = (Math.floor(reward / energy * 10) / 10);
                        if (bestReward < rewardRatio) {
                            this.updateAutoQuest('name', this.questName);
                            pickQuestTF = true;
                        }

                        break;
                    default :
                    }

                    utility.log(5, "Setting AutoQuest?", state.getItem('AutoQuest', this.newAutoQuest()), this.questName);
                    if (isTheArea && state.getItem('AutoQuest', this.newAutoQuest()).name === this.questName) {
                        bestReward = rewardRatio;
                        var expRatio = experience / energy;
                        utility.log(2, "Setting AutoQuest", this.questName);
                        var tempAutoQuest = this.newAutoQuest();
                        tempAutoQuest.name = this.questName;
                        tempAutoQuest.energy = energy;
                        tempAutoQuest.general = general;
                        tempAutoQuest.expRatio = expRatio;
                        state.setItem('AutoQuest', tempAutoQuest);
                        utility.log(3, "CheckResults_quests", state.getItem('AutoQuest', this.newAutoQuest()));
                        this.ShowAutoQuest();
                        autoQuestDivs.click    = click;
                        autoQuestDivs.tr       = div;
                        autoQuestDivs.genDiv   = genDiv;
                    }
                }
            }

            if (pickQuestTF) {
                if (state.getItem('AutoQuest', this.newAutoQuest()).name) {
                    utility.log(3, "CheckResults_quests(pickQuestTF)", state.getItem('AutoQuest', this.newAutoQuest()));
                    this.ShowAutoQuest();
                    return autoQuestDivs;
                }

                //if not find quest, probably you already maxed the subarea, try another area
                if ((whyQuest === 'Max Influence' || whyQuest === 'Advancement') && config.getItem('switchQuestArea', true)) {
                    utility.log(9, "QuestSubArea", questSubArea);
                    if (questSubArea && this.QuestAreaInfo[questSubArea] && this.QuestAreaInfo[questSubArea].next) {
                        questSubArea = config.setItem('QuestSubArea', this.QuestAreaInfo[questSubArea].next);
                        if (this.QuestAreaInfo[questSubArea].area && this.QuestAreaInfo[questSubArea].list) {
                            config.setItem('QuestArea', this.QuestAreaInfo[questSubArea].area);
                            this.ChangeDropDownList('QuestSubArea', this[this.QuestAreaInfo[questSubArea].list]);
                        }
                    } else {
                        utility.log(1, "Setting questing to manual");
                        this.ManualAutoQuest();
                    }

                    utility.log(2, "UpdateQuestGUI: Setting drop down menus");
                    this.SelectDropOption('QuestArea', config.getItem('QuestArea', 'Quest'));
                    this.SelectDropOption('QuestSubArea', questSubArea);
                    return false;
                }

                utility.log(1, "Finished QuestArea.");
                this.ManualAutoQuest();
            }

            return false;
        } catch (err) {
            utility.error("ERROR in CheckResults_quests: " + err);
            this.ManualAutoQuest();
            return false;
        }
    },

    ClassToQuestArea: {
        'quests_stage_1'         : 'Land of Fire',
        'quests_stage_2'         : 'Land of Earth',
        'quests_stage_3'         : 'Land of Mist',
        'quests_stage_4'         : 'Land of Water',
        'quests_stage_5'         : 'Demon Realm',
        'quests_stage_6'         : 'Undead Realm',
        'quests_stage_7'         : 'Underworld',
        'quests_stage_8'         : 'Kingdom of Heaven',
        'quests_stage_9'         : 'Ivory City',
        'quests_stage_10'        : 'Earth II',
        'symbolquests_stage_1'   : 'Ambrosia',
        'symbolquests_stage_2'   : 'Malekus',
        'symbolquests_stage_3'   : 'Corvintheus',
        'symbolquests_stage_4'   : 'Aurora',
        'symbolquests_stage_5'   : 'Azeron',
        'monster_quests_stage_1' : 'Atlantis'
    },

    CheckCurrentQuestArea: function (QuestSubArea) {
        try {
            var found = false;

            if (this.stats.level < 8) {
                if (utility.CheckForImage('quest_back_1.jpg')) {
                    found = true;
                }
            } else if (QuestSubArea && this.QuestAreaInfo[QuestSubArea]) {
                if ($("div[class='" + this.QuestAreaInfo[QuestSubArea].clas + "']").length) {
                    found = true;
                }
            }

            return found;
        } catch (err) {
            utility.error("ERROR in CheckCurrentQuestArea: " + err);
            return false;
        }
    },

    GetQuestName: function (questDiv) {
        try {
            var item_title = nHtml.FindByAttrXPath(questDiv, 'div', "@class='quest_desc' or @class='quest_sub_title'");
            if (!item_title) {
                utility.log(2, "Can't find quest description or sub-title");
                return false;
            }

            if (item_title.innerHTML.toString().match(/LOCK/)) {
                utility.log(2, "Quest locked", item_title);
                return false;
            }

            var firstb = item_title.getElementsByTagName('b')[0];
            if (!firstb) {
                utility.warn("Can't get bolded member out of", item_title.innerHTML.toString());
                return false;
            }

            this.questName = $.trim(firstb.innerHTML.toString()).stripHTML();
            if (!this.questName) {
                utility.warn('No quest name for this row');
                return false;
            }

            return this.questName;
        } catch (err) {
            utility.error("ERROR in GetQuestName: " + err);
            return false;
        }
    },

    /*------------------------------------------------------------------------------------\
    CheckEnergy gets passed the default energy requirement plus the condition text from
    the 'Whenxxxxx' setting and the message div name.
    \------------------------------------------------------------------------------------*/
    CheckEnergy: function (energy, condition, msgdiv) {
        try {
            if (!this.stats.energy || !energy) {
                return false;
            }

            if (condition === 'Energy Available' || condition === 'Not Fortifying') {
                if (this.stats.energy.num >= energy) {
                    return true;
                }

                if (msgdiv) {
                    this.SetDivContent(msgdiv, 'Waiting for more energy: ' + this.stats.energy.num + "/" + (energy ? energy : ""));
                }
            } else if (condition === 'At X Energy') {
                if (this.InLevelUpMode() && this.stats.energy.num >= energy) {
                    if (msgdiv) {
                        this.SetDivContent(msgdiv, 'Burning all energy to level up');
                    }

                    return true;
                }

                var whichEnergy = config.getItem('XQuestEnergy', 1);
                if (this.stats.energy.num >= whichEnergy) {
                    state.setItem('AtXQuestEnergy', true);
                }

                if (this.stats.energy.num >= energy) {
                    if (state.getItem('AtXQuestEnergy', false) && this.stats.energy.num >= config.getItem('XMinQuestEnergy', 0)) {
                        this.SetDivContent(msgdiv, 'At X energy. Burning to ' + config.getItem('XMinQuestEnergy', 0));
                        return true;
                    } else {
                        state.setItem('AtXQuestEnergy', false);
                    }
                }

                if (energy > whichEnergy) {
                    whichEnergy = energy;
                }

                if (msgdiv) {
                    this.SetDivContent(msgdiv, 'Waiting for X energy: ' + this.stats.energy.num + "/" + whichEnergy);
                }
            } else if (condition === 'At Max Energy') {
                var maxIdleEnergy = this.stats.energy.max,
                    theGeneral = config.getItem('IdleGeneral', 'Use Current');

                if (theGeneral !== 'Use Current') {
                    maxIdleEnergy = general.GetEnergyMax(theGeneral);
                }

                if (theGeneral !== 'Use Current' && !maxIdleEnergy) {
                    utility.log(2, "Changing to idle general to get Max energy");
                    if (general.Select('IdleGeneral')) {
                        return true;
                    }
                }

                if (this.stats.energy.num >= maxIdleEnergy) {
                    return true;
                }

                if (this.InLevelUpMode() && this.stats.energy.num >= energy) {
                    if (msgdiv) {
                        utility.log(1, "Burning all energy to level up");
                        this.SetDivContent(msgdiv, 'Burning all energy to level up');
                    }

                    return true;
                }

                if (msgdiv) {
                    this.SetDivContent(msgdiv, 'Waiting for max energy: ' + this.stats.energy.num + "/" + maxIdleEnergy);
                }
            }

            return false;
        } catch (err) {
            utility.error("ERROR in CheckEnergy: " + err);
            return false;
        }
    },

    LabelListener: function (e) {
        try {
            var sps           = e.target.getElementsByTagName('span'),
                mainDiv       = null,
                className     = '',
                tempAutoQuest = {};

            if (sps.length <= 0) {
                throw 'what did we click on?';
            }

            tempAutoQuest = caap.newAutoQuest();
            tempAutoQuest.name = sps[0].innerHTML;
            tempAutoQuest.energy = parseInt(sps[1].innerHTML, 10);
            //tempAutoQuest.general = general;
            //tempAutoQuest.expRatio = expRatio;

            caap.ManualAutoQuest(tempAutoQuest);
            utility.log(5, 'LabelListener', sps, state.getItem('AutoQuest'));
            if (caap.stats.level < 10 && utility.CheckForImage('quest_back_1.jpg')) {
                config.setItem('QuestArea', 'Quest');
                config.setItem('QuestSubArea', 'Land of Fire');
            } else {
                if (utility.CheckForImage('tab_quest_on.gif')) {
                    config.setItem('QuestArea', 'Quest');
                    caap.SelectDropOption('QuestArea', 'Quest');
                    caap.ChangeDropDownList('QuestSubArea', caap.landQuestList);
                } else if (utility.CheckForImage('demi_quest_on.gif')) {
                    config.setItem('QuestArea', 'Demi Quests');
                    caap.SelectDropOption('QuestArea', 'Demi Quests');
                    caap.ChangeDropDownList('QuestSubArea', caap.demiQuestList);
                } else if (utility.CheckForImage('tab_atlantis_on.gif')) {
                    config.setItem('QuestArea', 'Atlantis');
                    caap.SelectDropOption('QuestArea', 'Atlantis');
                    caap.ChangeDropDownList('QuestSubArea', caap.atlantisQuestList);
                }

                mainDiv = $("#app46755028429_main_bn");
                if (mainDiv && mainDiv.length) {
                    className = mainDiv.attr("class");
                    if (className && caap.ClassToQuestArea[className]) {
                        config.setItem('QuestSubArea', caap.ClassToQuestArea[className]);
                    }
                }
            }

            utility.log(1, 'Setting QuestSubArea to', config.getItem('QuestSubArea', 'Land Of Fire'));
            caap.SelectDropOption('QuestSubArea', config.getItem('QuestSubArea', 'Land Of Fire'));
            caap.ShowAutoQuest();
            caap.CheckResults_quests();
            return true;
        } catch (err) {
            utility.error("ERROR in LabelListener: " + err);
            return false;
        }
    },

    LabelQuests: function (div, energy, reward, experience, click) {
        if ($(div).find("div[class='autoquest'").length) {
            return;
        }

        div = document.createElement('div');
        div.className = 'autoquest';
        div.style.fontSize = '10px';
        div.innerHTML = "$ per energy: " + (Math.floor(reward / energy * 10) / 10) +
            "<br />Exp per energy: " + (Math.floor(experience / energy * 100) / 100) + "<br />";

        if (state.getItem('AutoQuest', this.newAutoQuest()).name === this.questName) {
            var b = document.createElement('b');
            b.innerHTML = "Current auto quest";
            div.appendChild(b);
        } else {
            var setAutoQuest = document.createElement('a');
            setAutoQuest.innerHTML = 'Auto run this quest.';
            setAutoQuest.quest_name = this.questName;

            var quest_nameObj = document.createElement('span');
            quest_nameObj.innerHTML = this.questName;
            quest_nameObj.style.display = 'none';
            setAutoQuest.appendChild(quest_nameObj);

            var quest_energyObj = document.createElement('span');
            quest_energyObj.innerHTML = energy;
            quest_energyObj.style.display = 'none';
            setAutoQuest.appendChild(quest_energyObj);
            setAutoQuest.addEventListener("click", this.LabelListener, false);

            div.appendChild(setAutoQuest);
        }

        div.style.position = 'absolute';
        div.style.background = '#B09060';
        div.style.right = "144px";
        click.parentNode.insertBefore(div, click);
    },

    /////////////////////////////////////////////////////////////////////
    //                          AUTO BLESSING
    /////////////////////////////////////////////////////////////////////

    deityTable: {
        energy  : 1,
        attack  : 2,
        defense : 3,
        health  : 4,
        stamina : 5
    },

    BlessingResults: function (resultsText) {
        // Check time until next Oracle Blessing
        if (resultsText.match(/Please come back in: /)) {
            var hours   = parseInt(resultsText.match(/ \d+ hour/), 10),
                minutes = parseInt(resultsText.match(/ \d+ minute/), 10);

            schedule.setItem('BlessingTimer', (hours * 60 + minutes) * 60, 300);
            utility.log(2, 'Recorded Blessing Time. Scheduling next click!');
        }

        // Recieved Demi Blessing.  Wait 24 hours to try again.
        if (resultsText.match(/You have paid tribute to/)) {
            schedule.setItem('BlessingTimer', 86400, 300);
            utility.log(2, 'Received blessing. Scheduling next click!');
        }

        this.SetCheckResultsFunction('');
    },

    AutoBless: function () {
        var autoBless = config.getItem('AutoBless', 'None').toLowerCase();
        if (autoBless === 'none') {
            return false;
        }

        if (!schedule.check('BlessingTimer')) {
            return false;
        }

        if (utility.NavigateTo('quests,demi_quest_off', 'demi_quest_bless')) {
            return true;
        }

        var picSlice = nHtml.FindByAttrContains(document.body, 'img', 'src', 'deity_' + autoBless);
        if (!picSlice) {
            utility.warn('No diety pics for deity', autoBless);
            return false;
        }

        if (picSlice.style.height !== '160px') {
            return utility.NavigateTo('deity_' + autoBless);
        }

        picSlice = nHtml.FindByAttrContains(document.body, 'form', 'id', '_symbols_form_' + this.deityTable[autoBless]);
        if (!picSlice) {
            utility.warn('No form for deity blessing.');
            return false;
        }

        picSlice = utility.CheckForImage('demi_quest_bless', picSlice);
        if (!picSlice) {
            utility.warn('No image for deity blessing.');
            return false;
        }

        utility.log(1, 'Click deity blessing for ', autoBless);
        schedule.setItem('BlessingTimer', 3600, 300);
        this.SetCheckResultsFunction('BlessingResults');
        utility.Click(picSlice);
        return true;
    },

    /////////////////////////////////////////////////////////////////////
    //                          LAND
    // Displays return on lands and perfom auto purchasing
    /////////////////////////////////////////////////////////////////////

    LandsGetNameFromRow: function (row) {
        // schoolofmagic, etc. <div class=item_title
        var infoDiv = nHtml.FindByAttrXPath(row, 'div', "contains(@class,'land_buy_info') or contains(@class,'item_title')");
        if (!infoDiv) {
            utility.warn("can't find land_buy_info");
        }

        if (infoDiv.className.indexOf('item_title') >= 0) {
            return $.trim(infoDiv.textContent);
        }

        var strongs = infoDiv.getElementsByTagName('strong');
        if (strongs.length < 1) {
            return null;
        }

        return $.trim(strongs[0].textContent);
    },

    bestLand: {
        land : '',
        roi  : 0
    },

    CheckResults_land: function () {
        if (nHtml.FindByAttrXPath(document, 'div', "contains(@class,'caap_landDone')")) {
            return null;
        }

        state.setItem('BestLandCost', 0);
        this.sellLand = '';
        this.bestLand.roi = 0;
        this.IterateLands(function (land) {
            this.SelectLands(land.row, 2);
            var roi = (parseInt((land.income / land.totalCost) * 240000, 10) / 100);
            var div = null;
            if (!nHtml.FindByAttrXPath(land.row, 'input', "@name='Buy'")) {
                roi = 0;
                // Lets get our max allowed from the land_buy_info div
                div = nHtml.FindByAttrXPath(land.row, 'div', "contains(@class,'land_buy_info') or contains(@class,'item_title')");
                var maxText = $.trim(nHtml.GetText(div).match(/:\s+\d+/i).toString());
                var maxAllowed = Number(maxText.replace(/:\s+/, ''));
                // Lets get our owned total from the land_buy_costs div
                div = nHtml.FindByAttrXPath(land.row, 'div', "contains(@class,'land_buy_costs')");
                var ownedText = $.trim(nHtml.GetText(div).match(/:\s+\d+/i).toString());
                var owned = Number(ownedText.replace(/:\s+/, ''));
                // If we own more than allowed we will set land and selection
                var selection = [1, 5, 10];
                for (var s = 2; s >= 0; s -= 1) {
                    if (owned - maxAllowed >= selection[s]) {
                        this.sellLand = land;
                        this.sellLand.selection = s;
                        break;
                    }
                }
            }

            div = nHtml.FindByAttrXPath(land.row, 'div', "contains(@class,'land_buy_info') or contains(@class,'item_title')").getElementsByTagName('strong');
            div[0].innerHTML += " | " + roi + "% per day.";
            if (!land.usedByOther) {
                if (!(this.bestLand.roi || roi === 0) || roi > this.bestLand.roi) {
                    this.bestLand.roi = roi;
                    this.bestLand.land = land;
                    state.setItem('BestLandCost', this.bestLand.land.cost);
                }
            }
        });

        var bestLandCost = state.getItem('BestLandCost', '');
        utility.log(2, "Best Land Cost: ", bestLandCost);
        if (!bestLandCost) {
            state.setItem('BestLandCost', 'none');
        }

        var div = document.createElement('div');
        div.className = 'caap_landDone';
        div.style.display = 'none';
        nHtml.FindByAttrContains(document.body, "tr", "class", 'land_buy_row').appendChild(div);
        return null;
    },

    IterateLands: function (func) {
        var content = document.getElementById('content'),
            ss = document.evaluate(".//tr[contains(@class,'land_buy_row')]", content, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        if (!ss || (ss.snapshotLength === 0)) {
            utility.log(9, "Can't find land_buy_row");
            return null;
        }

        var landByName = {},
            landNames = [];

        utility.log(9, 'forms found', ss.snapshotLength);
        var numberRegExp = new RegExp("([0-9,]+)");
        for (var s = 0, len = ss.snapshotLength; s < len; s += 1) {
            var row = ss.snapshotItem(s);
            if (!row) {
                continue;
            }

            var name = this.LandsGetNameFromRow(row);
            if (name === null || name === '') {
                utility.warn("Can't find land name");
                continue;
            }

            var moneyss = document.evaluate(".//*[contains(@class,'gold') or contains(@class,'currency')]", row, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            if (moneyss.snapshotLength < 2) {
                utility.warn("Can't find 2 gold instances");
                continue;
            }

            var income = 0;
            var nums = [];
            for (var sm = 0, len1 = moneyss.snapshotLength; sm < len1; sm += 1) {
                income = moneyss.snapshotItem(sm);
                if (income.className.indexOf('label') >= 0) {
                    income = income.parentNode;
                    var m = numberRegExp.exec(income.textContent);
                    if (m && m.length >= 2 && m[1].length > 1) {
                        // number must be more than a digit or else it could be a "? required" text
                        income = utility.NumberOnly(m[1]);
                    } else {
                        utility.log(9, 'Cannot find income for ', name, income.textContent);
                        income = 0;
                        continue;
                    }
                } else {
                    income = utility.NumberOnly(income.textContent);
                }
                nums.push(income);
            }

            income = nums[0];
            var cost = nums[1];
            if (!income || !cost) {
                utility.warn("Can't find income or cost for", name);
                continue;
            }

            if (income > cost) {
                // income is always less than the cost of land.
                income = nums[1];
                cost = nums[0];
            }

            var totalCost = cost;
            var land = {
                'row'         : row,
                'name'        : name,
                'income'      : income,
                'cost'        : cost,
                'totalCost'   : totalCost,
                'usedByOther' : false
            };

            landByName[name] = land;
            landNames.push(name);
        }

        for (var p = 0, len2 = landNames.length; p < len2; p += 1) {
            func.call(this, landByName[landNames[p]]);
        }

        return landByName;
    },

    SelectLands: function (row, val) {
        var selects = row.getElementsByTagName('select');
        if (selects.length < 1) {
            return false;
        }

        var select = selects[0];
        select.selectedIndex = val;
        return true;
    },

    BuyLand: function (land) {
        this.SelectLands(land.row, 2);
        var button = nHtml.FindByAttrXPath(land.row, 'input', "@type='submit' or @type='image'");
        if (button) {
            utility.log(9, "Clicking buy button", button);
            utility.log(1, "Buying Land", land.name);
            utility.Click(button, 15000);
            state.setItem('BestLandCost', 0);
            this.bestLand.roi = 0;
            return true;
        }

        return false;
    },

    SellLand: function (land, select) {
        this.SelectLands(land.row, select);
        var button = nHtml.FindByAttrXPath(land.row, 'input', "@type='submit' or @type='image'");
        if (button) {
            utility.log(9, "Clicking sell button", button);
            utility.log(1, "Selling Land: ", land.name);
            utility.Click(button, 15000);
            this.sellLand = '';
            return true;
        }

        return false;
    },

    Lands: function () {
        if (config.getItem('autoBuyLand', false)) {
            // Do we have lands above our max to sell?
            if (this.sellLand && config.getItem('SellLands', false)) {
                this.SellLand(this.sellLand, this.sellLand.selection);
                return true;
            }

            var bestLandCost = state.getItem('BestLandCost', '');
            if (!bestLandCost) {
                utility.log(2, "Going to land to get Best Land Cost");
                if (utility.NavigateTo('soldiers,land', 'tab_land_on.gif')) {
                    return true;
                }
            }

            if (bestLandCost === 'none') {
                utility.log(3, "No Lands avaliable");
                return false;
            }

            utility.log(4, "Lands: How much gold in store?", this.stats.gold.bank);
            if (!this.stats.gold.bank && this.stats.gold.bank !== 0) {
                utility.log(2, "Going to keep to get Stored Value");
                if (utility.NavigateTo('keep')) {
                    return true;
                }
            }

            // Retrieving from Bank
            var cashTotAvail = this.stats.gold.cash + (this.stats.gold.bank - config.getItem('minInStore', 0));
            var cashNeed = 10 * bestLandCost;
            var theGeneral = config.getItem('IdleGeneral', 'Use Current');
            if ((cashTotAvail >= cashNeed) && (this.stats.gold.cash < cashNeed)) {
                if (theGeneral !== 'Use Current') {
                    utility.log(2, "Changing to idle general");
                    if (general.Select('IdleGeneral')) {
                        return true;
                    }
                }

                utility.log(1, "Trying to retrieve", 10 * bestLandCost - this.stats.gold.cash);
                return this.RetrieveFromBank(10 * bestLandCost - this.stats.gold.cash);
            }

            // Need to check for enough moneys + do we have enough of the builton type that we already own.
            if (bestLandCost && this.stats.gold.cash >= 10 * bestLandCost) {
                if (theGeneral !== 'Use Current') {
                    utility.log(2, "Changing to idle general");
                    if (general.Select('IdleGeneral')) {
                        return true;
                    }
                }

                utility.NavigateTo('soldiers,land');
                if (utility.CheckForImage('tab_land_on.gif')) {
                    utility.log(2, "Buying land", this.bestLand.land.name);
                    if (this.BuyLand(this.bestLand.land)) {
                        return true;
                    }
                } else {
                    return utility.NavigateTo('soldiers,land');
                }
            }
        }

        return false;
    },

    CheckKeep: function () {
        try {
            if (!schedule.check("keep")) {
                return false;
            }

            utility.log(2, 'Visiting keep to get stats');
            return utility.NavigateTo('keep', 'tab_stats_on.gif');
        } catch (err) {
            utility.error("ERROR in CheckKeep: " + err);
            return false;
        }
    },

    CheckOracle: function () {
        try {
            if (!schedule.check("oracle")) {
                return false;
            }

            utility.log(2, "Checking Oracle for Favor Points");
            return utility.NavigateTo('oracle', 'oracle_on.gif');
        } catch (err) {
            utility.error("ERROR in CheckOracle: " + err);
            return false;
        }
    },

    CheckBattleRank: function () {
        try {
            if (!schedule.check("battlerank") || this.stats.level < 8) {
                return false;
            }

            utility.log(2, 'Visiting Battle Rank to get stats');
            return utility.NavigateTo('battle,battlerank', 'tab_battle_rank_on.gif');
        } catch (err) {
            utility.error("ERROR in CheckBattleRank: " + err);
            return false;
        }
    },

    CheckWarRank: function () {
        try {
            if (!schedule.check("warrank") || this.stats.level < 100) {
                return false;
            }

            utility.log(2, 'Visiting War Rank to get stats');
            return utility.NavigateTo('battle,war_rank', 'tab_war_on.gif');
        } catch (err) {
            utility.error("ERROR in CheckWar: " + err);
            return false;
        }
    },

    CheckGenerals: function () {
        try {
            if (!schedule.check("generals")) {
                return false;
            }

            utility.log(2, "Visiting generals to get 'General' list");
            return utility.NavigateTo('mercenary,generals', 'tab_generals_on.gif');
        } catch (err) {
            utility.error("ERROR in CheckGenerals: " + err);
            return false;
        }
    },

    CheckSoldiers: function () {
        try {
            if (!schedule.check("soldiers")) {
                return false;
            }

            utility.log(2, "Checking Soldiers");
            return utility.NavigateTo('soldiers', 'tab_soldiers_on.gif');
        } catch (err) {
            utility.error("ERROR in CheckSoldiers: " + err);
            return false;
        }
    },


    CheckItem: function () {
        try {
            if (!schedule.check("item")) {
                return false;
            }

            utility.log(2, "Checking Item");
            return utility.NavigateTo('soldiers,item', 'tab_black_smith_on.gif');
        } catch (err) {
            utility.error("ERROR in CheckItem: " + err);
            return false;
        }
    },

    CheckMagic: function () {
        try {
            if (!schedule.check("magic")) {
                return false;
            }

            utility.log(2, "Checking Magic");
            return utility.NavigateTo('soldiers,magic', 'tab_magic_on.gif');
        } catch (err) {
            utility.error("ERROR in CheckMagic: " + err);
            return false;
        }
    },

    CheckAchievements: function () {
        try {
            if (!schedule.check("achievements")) {
                return false;
            }

            utility.log(2, 'Visiting achievements to get stats');
            return utility.NavigateTo('keep,achievements', 'tab_achievements_on.gif');
        } catch (err) {
            utility.error("ERROR in CheckAchievements: " + err);
            return false;
        }
    },

    CheckSymbolQuests: function () {
        try {
            if (!schedule.check("symbolquests") || this.stats.level < 8) {
                return false;
            }

            utility.log(2, "Visiting symbolquests to get 'Demi-Power' points");
            return utility.NavigateTo('quests,symbolquests', 'demi_quest_on.gif');
        } catch (err) {
            utility.error("ERROR in CheckSymbolQuests: " + err);
            return false;
        }
    },

    CheckCharacterClasses: function () {
        try {
            if (!schedule.check("view_class_progress") || this.stats.level < 100) {
                return false;
            }

            utility.log(2, "Checking Monster Class to get Character Class Stats");
            return utility.NavigateTo('battle_monster,view_class_progress', 'nm_class_whole_progress_bar.jpg');
        } catch (err) {
            utility.error("ERROR in CheckCharacterClasses: " + err);
            return false;
        }
    },

    CheckGift: function () {
        try {
            if (!schedule.check("gift")) {
                return false;
            }

            utility.log(2, "Checking Gift");
            return utility.NavigateTo('army,gift', 'tab_gifts_on.gif');
        } catch (err) {
            utility.error("ERROR in CheckGift: " + err);
            return false;
        }
    },

    /////////////////////////////////////////////////////////////////////
    //                          BATTLING PLAYERS
    /////////////////////////////////////////////////////////////////////

    BattleUserId: function (userid) {
        try {
            if (battle.hashCheck(userid)) {
                return true;
            }

            var battleButton = null,
                form = null,
                inp = null;

            battleButton = utility.CheckForImage(battle.battles.Freshmeat[config.getItem('BattleType', 'Invade')]);
            if (battleButton) {
                form = $(battleButton).parent().parent();
                if (form && form.length) {
                    inp = form.find("input[name='target_id']");
                    if (inp && inp.length) {
                        inp.attr("value", userid);
                        state.setItem("lastBattleID", userid);
                        battle.click(battleButton);
                        state.setItem("notSafeCount", 0);
                        return true;
                    } else {
                        utility.warn("target_id not found in battleForm");
                    }
                } else {
                    utility.warn("form not found in battleButton");
                }
            } else {
                utility.warn("battleButton not found");
            }

            return false;
        } catch (err) {
            utility.error("ERROR in BattleUserId: " + err);
            return false;
        }
    },

    battleWarnLevel: true,

    Battle: function (mode) {
        try {
            var whenBattle    = '',
                target        = '',
                battletype    = '',
                useGeneral    = '',
                staminaReq    = 0,
                chainImg      = '',
                button        = null,
                raidName      = '',
                battleChainId = 0,
                targetMonster = '',
                whenMonster   = '',
                targetType    = '',
                rejoinSecs    = '',
                battleRecord  = {},
                tempTime      = new Date(2009, 0, 1).getTime();

            if (this.stats.level < 8) {
                if (this.battleWarnLevel) {
                    utility.log(1, "Battle: Unlock at level 8");
                    this.battleWarnLevel = false;
                }

                return false;
            }

            whenBattle = config.getItem('WhenBattle', 'Never');
            whenMonster = config.getItem('WhenMonster', 'Never');
            targetMonster = state.getItem('targetFrombattle_monster', '');
            switch (whenBattle) {
            case 'Never' :
                this.SetDivContent('battle_mess', 'Battle off');
                return false;
            case 'Stay Hidden' :
                if (!this.NeedToHide()) {
                    this.SetDivContent('battle_mess', 'We Dont Need To Hide Yet');
                    utility.log(1, 'We Dont Need To Hide Yet');
                    return false;
                }

                break;
            case 'No Monster' :
                if (mode !== 'DemiPoints') {
                    if (whenMonster !== 'Never' && targetMonster && !targetMonster.match(/the deathrune siege/i)) {
                        return false;
                    }
                }

                break;
            case 'Demi Points Only' :
                if (mode === 'DemiPoints' && whenMonster === 'Never') {
                    return false;
                }

                if (mode !== 'DemiPoints' && whenMonster !== 'Never' && targetMonster && !targetMonster.match(/the deathrune siege/i)) {
                    return false;
                }

                if (battle.selectedDemisDone(true) || (config.getItem("DemiPointsFirst", false) && whenMonster !== 'Never' && config.getItem("observeDemiFirst", false) && state.getItem('DemiPointsDone', false))) {
                    return false;
                }

                break;
            default :
            }

            if (this.CheckKeep()) {
                return true;
            }

            if (this.stats.health.num < 10) {
                utility.log(5, 'Health is less than 10: ', this.stats.health.num);
                return false;
            }

            if (config.getItem("waitSafeHealth", false) && this.stats.health.num < 13) {
                utility.log(5, 'Unsafe. Health is less than 13: ', this.stats.health.num);
                return false;
            }

            target = battle.getTarget(mode);
            utility.log(5, 'Mode/Target', mode, target);
            if (!target) {
                utility.log(1, 'No valid battle target');
                return false;
            } else if (!utility.isNum(target)) {
                target = target.toLowerCase();
            }

            if (target === 'noraid') {
                utility.log(5, 'No Raid To Attack');
                return false;
            }

            battletype = config.getItem('BattleType', 'Invade');
            switch (battletype) {
            case 'Invade' :
                useGeneral = 'InvadeGeneral';
                staminaReq = 1;
                chainImg = 'battle_invade_again.gif';
                if (general.LevelUpCheck(useGeneral)) {
                    useGeneral = 'LevelUpGeneral';
                    utility.log(2, 'Using level up general');
                }

                break;
            case 'Duel' :
                useGeneral = 'DuelGeneral';
                staminaReq = 1;
                chainImg = 'battle_duel_again.gif';
                if (general.LevelUpCheck(useGeneral)) {
                    useGeneral = 'LevelUpGeneral';
                    utility.log(2, 'Using level up general');
                }

                break;
            case 'War' :
                useGeneral = 'WarGeneral';
                staminaReq = 10;
                chainImg = 'battle_duel_again.gif';
                if (general.LevelUpCheck(useGeneral)) {
                    useGeneral = 'LevelUpGeneral';
                    utility.log(2, 'Using level up general');
                }

                break;
            default :
                utility.warn('Unknown battle type ', battletype);
                return false;
            }

            if (!this.CheckStamina('Battle', staminaReq)) {
                utility.log(9, 'Not enough stamina for ', battletype);
                return false;
            } else if (general.Select(useGeneral)) {
                return true;
            }

            // Check if we should chain attack
            if ($("#app46755028429_results_main_wrapper img[src*='battle_victory.gif']").length) {
                button = utility.CheckForImage(chainImg);
                battleChainId = state.getItem("BattleChainId", 0);
                if (button && battleChainId) {
                    this.SetDivContent('battle_mess', 'Chain Attack In Progress');
                    utility.log(2, 'Chaining Target', battleChainId);
                    battle.click(button);
                    state.setItem("BattleChainId", 0);
                    return true;
                }
            }

            if (!state.getItem("notSafeCount", 0)) {
                state.setItem("notSafeCount", 0);
            }

            utility.log(2, 'Battle Target', target);
            targetType = config.getItem('TargetType', 'Invade');
            switch (target) {
            case 'raid' :
                if (!schedule.check("RaidNoTargetDelay")) {
                    rejoinSecs = ((schedule.getItem("RaidNoTargetDelay").next - new Date().getTime()) / 1000).toFixed() + ' secs';
                    utility.log(2, 'Rejoining the raid in', rejoinSecs);
                    this.SetDivContent('battle_mess', 'Joining the Raid in ' + rejoinSecs);
                    return true;
                }

                this.SetDivContent('battle_mess', 'Joining the Raid');
                if (utility.NavigateTo(this.battlePage + ',raid', 'tab_raid_on.gif')) {
                    return true;
                }

                if (config.getItem('clearCompleteRaids', false) && monster.completeButton.raid.button && monster.completeButton.raid.name) {
                    utility.Click(monster.completeButton.raid.button);
                    monster.deleteItem(monster.completeButton.raid.name);
                    monster.completeButton.raid = {};
                    this.UpdateDashboard(true);
                    utility.log(1, 'Cleared a completed raid');
                    return true;
                }

                raidName = state.getItem('targetFromraid', '');
                if (!$("div[style*='dragon_title_owner']").length) {
                    button = monster.engageButtons[raidName];
                    if (button) {
                        utility.Click(button);
                        return true;
                    }

                    utility.warn('Unable to engage raid', raidName);
                    return false;
                }

                if (monster.ConfirmRightPage(raidName)) {
                    return true;
                }

                // The user can specify 'raid' in their Userid List to get us here. In that case we need to adjust NextBattleTarget when we are done
                if (targetType === "Userid List") {
                    if (battle.freshmeat('Raid')) {
                        if ($("span[class*='result_body']").length) {
                            battle.nextTarget();
                        }

                        if (state.getItem("notSafeCount", 0) > 10) {
                            state.setItem("notSafeCount", 0);
                            battle.nextTarget();
                        }

                        return true;
                    }

                    utility.warn('Doing Raid UserID list, but no target');
                    return false;
                }

                return battle.freshmeat('Raid');
            case 'freshmeat' :
                if (utility.NavigateTo(this.battlePage, 'battle_on.gif')) {
                    return true;
                }

                this.SetDivContent('battle_mess', 'Battling ' + target);
                // The user can specify 'freshmeat' in their Userid List to get us here. In that case we need to adjust NextBattleTarget when we are done
                if (targetType === "Userid List") {
                    if (battle.freshmeat('Freshmeat')) {
                        if ($("span[class*='result_body']").length) {
                            battle.nextTarget();
                        }

                        if (state.getItem("notSafeCount", 0) > 10) {
                            state.setItem("notSafeCount", 0);
                            battle.nextTarget();
                        }

                        return true;
                    }

                    utility.warn('Doing Freshmeat UserID list, but no target');
                    return false;
                }

                return battle.freshmeat('Freshmeat');
            default:
                if (!config.getItem("IgnoreBattleLoss", false)) {
                    battleRecord = battle.getItem(target);
                    switch (config.getItem("BattleType", 'Invade')) {
                    case 'Invade' :
                        tempTime = battleRecord.invadeLostTime ? battleRecord.invadeLostTime : tempTime;
                        break;
                    case 'Duel' :
                        tempTime = battleRecord.duelLostTime ? battleRecord.duelLostTime : tempTime;
                        break;
                    case 'War' :
                        tempTime = battleRecord.warlostTime ? battleRecord.warlostTime : tempTime;
                        break;
                    default :
                        utility.warn("Battle type unknown!", config.getItem("BattleType", 'Invade'));
                    }

                    if (battleRecord && battleRecord.nameStr !== '' && !schedule.since(tempTime, 604800)) {
                        utility.log(1, 'Avoiding Losing Target', target);
                        battle.nextTarget();
                        return true;
                    }
                }

                if (utility.NavigateTo(this.battlePage, 'battle_on.gif')) {
                    return true;
                }

                state.setItem('BattleChainId', 0);
                if (this.BattleUserId(target)) {
                    battle.nextTarget();
                    return true;
                }

                utility.warn('Doing default UserID list, but no target');
                return false;
            }
        } catch (err) {
            utility.error("ERROR in Battle: " + err);
            return false;
        }
    },

    /////////////////////////////////////////////////////////////////////
    //                          ATTACKING MONSTERS
    /////////////////////////////////////////////////////////////////////

    CheckResults_guild_current_battles: function () {
        try {
            var tempDiv = null;

            tempDiv = $("img[src*='guild_symbol']");
            if (tempDiv && tempDiv.length) {
                tempDiv.each(function () {
                    utility.log(5, "name", $.trim($(this).parent().parent().next().text()));
                    utility.log(5, "button", $(this).parent().parent().parent().next().find("input[src*='dragon_list_btn_']"));
                });
            } else {
                return false;
            }

            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults_guild_current_battles: " + err);
            return false;
        }
    },

    CheckResults_guild_current_monster_battles: function () {
        try {
            guild_monster.populate();

            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults_guild_current_monster_battles: " + err);
            return false;
        }
    },

    CheckResults_guild_battle_monster: function () {
        try {
            guild_monster.onMonster();
            if (config.getItem("enableTitles", true)) {
                spreadsheet.doTitles();
            }

            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults_guild_battle_monster: " + err);
            return false;
        }
    },

    CheckResults_guild: function () {
        try {
            // Guild
            var guildIdDiv  = null,
                guildMemDiv = null,
                guildTxt    = '',
                save        = false;

            guildIdDiv = $("#app46755028429_guild_blast input[name='guild_id']");
            if (guildIdDiv && guildIdDiv.length) {
                this.stats.guild.id = guildIdDiv.attr("value");
                save = true;
            } else {
                utility.warn('Using stored guild_id.');
            }

            guildTxt = $("#app46755028429_guild_banner_section").text();
            if (guildTxt) {
                this.stats.guild.name = $.trim(guildTxt);
                save = true;
            } else {
                utility.warn('Using stored guild name.');
            }

            guildMemDiv = $("#app46755028429_cta_log div[style='padding-bottom: 5px;']");
            if (guildMemDiv && guildMemDiv.length) {
                this.stats.guild.members = guildMemDiv.length;
                save = true;
            } else {
                utility.warn('Using stored guild member count.');
            }

            utility.log(3, "CheckResults_guild", this.stats.guild);
            if (save) {
                this.SaveStats();
            }
            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults_guild: " + err);
            return false;
        }
    },

    GuildMonster: function () {
        try {
            var when    = config.getItem("WhenGuildMonster", 'Never'),
                record  = {},
                minion  = {},
                button  = null,
                form    = null,
                key     = null,
                url     = '',
                attack  = 0,
                stamina = 0;

            if (when === 'Never') {
                return false;
            }

            if (!this.stats.guild.id) {
                utility.log(2, "Going to guild to get Guild Id");
                if (utility.NavigateTo('guild')) {
                    return true;
                }
            }

            /*
            if (!this.stats.guild.id) {
                utility.log(2, "Going to keep to get Guild Id");
                if (utility.NavigateTo('keep')) {
                    return true;
                }
            }
            */

            if (config.getItem('doClassicMonstersFirst', false) && config.getItem("WhenMonster", 'Never') !== 'Never') {
                if (config.getItem("DemiPointsFirst", false) && !battle.selectedDemisDone()) {
                    return false;
                }

                if ((state.getItem('targetFrombattle_monster', '') || state.getItem('targetFromraid', ''))) {
                    return false;
                }
            }

            if (this.InLevelUpMode()) {
                if (this.stats.staminaT.num < 5) {
                    caap.SetDivContent('guild_monster_mess', 'Guild Monster stamina ' + this.stats.staminaT.num + '/' + 5);
                    return false;
                }
            } else if (when === 'Stamina Available') {
                stamina = state.getItem('staminaGuildMonster', 0);
                if (this.stats.staminaT.num < stamina) {
                    caap.SetDivContent('guild_monster_mess', 'Guild Monster stamina ' + this.stats.staminaT.num + '/' + stamina);
                    return false;
                }

                state.setItem('staminaGuildMonster', 0);
                record = state.getItem('targetGuildMonster', {});
                if (record && $.isPlainObject(record) && !$.isEmptyObject(record)) {
                    minion = guild_monster.getTargetMinion(record);
                    if (minion && $.isPlainObject(minion) && !$.isEmptyObject(minion)) {
                        stamina = guild_monster.getStaminaValue(minion);
                        state.setItem('staminaGuildMonster', stamina);
                        if (this.stats.staminaT.num < stamina) {
                            caap.SetDivContent('guild_monster_mess', 'Guild Monster stamina ' + this.stats.staminaT.num + '/' + stamina);
                            return false;
                        }
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            } else if (when === 'At X Stamina') {
                if (this.stats.staminaT.num >= config.getItem("MaxStaminaToGMonster", 20)) {
                    state.setItem('guildMonsterBattlesBurn', true);
                }

                if (this.stats.staminaT.num <= config.getItem("MinStaminaToGMonster", 0) || this.stats.staminaT.num < 1) {
                    state.setItem('guildMonsterBattlesBurn', false);
                }

                if (!state.getItem('guildMonsterBattlesBurn', false)) {
                    caap.SetDivContent('guild_monster_mess', 'Guild Monster stamina ' + this.stats.staminaT.num + '/' + config.getItem("MaxStaminaToGMonster", 20));
                    return false;
                }
            } else if (when === 'At Max Stamina') {
                if (this.stats.staminaT.num < this.stats.stamina.max || this.stats.staminaT.num < 1) {
                    caap.SetDivContent('guild_monster_mess', 'Guild Monster stamina ' + this.stats.staminaT.num + '/' + this.stats.stamina.max);
                    return false;
                }
            }

            caap.SetDivContent('guild_monster_mess', '');
            record = guild_monster.select(true);
            if (record && $.isPlainObject(record) && !$.isEmptyObject(record)) {
                if (general.Select('GuildMonsterGeneral')) {
                    return true;
                }

                if (!guild_monster.checkPage(record)) {
                    utility.log(2, "Fighting Slot (" + record.slot + ") Name: " + record.name);
                    caap.SetDivContent('guild_monster_mess', "Fighting ("  + record.slot + ") " + record.name);
                    url = "guild_battle_monster.php?twt2=" + record.name.replace(/ /g, '_') + "&guild_id=" + record.guildId + "&slot=" + record.slot;
                    utility.ClickAjaxLinkSend(url);
                    return true;
                }

                minion = guild_monster.getTargetMinion(record);
                if (minion && $.isPlainObject(minion) && !$.isEmptyObject(minion)) {
                    utility.log(2, "Fighting target_id (" + minion.target_id + ") Name: " + minion.name);
                    caap.SetDivContent('guild_monster_mess', "Fighting (" + minion.target_id + ") " + minion.name);
                    key = $("#app46755028429_attack_key_" + minion.target_id);
                    if (key && key.length) {
                        attack = guild_monster.getAttackValue(minion);
                        if (!attack) {
                            return false;
                        }

                        key.attr("value", attack);
                        form = key.parents("form").eq(0);
                        if (form && form.length) {
                            utility.Click(form.find("input[src*='guild_duel_button2.gif']").get(0));
                            return true;
                        }
                    }
                }
            }

            return false;
        } catch (err) {
            utility.error("ERROR in GuildMonster: " + err);
            return false;
        }
    },

    CheckResults_fightList: function () {
        try {
            var buttonsDiv            = null,
                page                  = '',
                monsterReviewed       = {},
                startCount            = 0,
                it                    = 0,
                len                   = 0,
                url                   = '',
                delList               = [],
                siege                 = '',
                engageButtonName      = '',
                monsterName           = '',
                monsterRow            = null,
                monsterFull           = '',
                summonDiv             = null,
                tempText              = '';

            // get all buttons to check monsterObjectList
            summonDiv = $("img[src*='mp_button_summon_']");
            buttonsDiv = $("img[src*='dragon_list_btn_']");
            if ((!summonDiv || !summonDiv.length) && (!buttonsDiv || !buttonsDiv.length)) {
                utility.log(2, "No buttons found");
                return false;
            }

            page = state.getItem('page', 'battle_monster');
            if (page === 'battle_monster' && (!buttonsDiv || !buttonsDiv.length)) {
                utility.log(2, "No monsters to review");
                state.setItem('reviewDone', true);
                return true;
            }

            tempText = buttonsDiv.eq(0).parent().attr("href");
            if (state.getItem('pageUserCheck', '') && tempText && !(tempText.match('user=' + this.stats.FBID) || tempText.match(/alchemy\.php/))) {
                utility.log(2, "On another player's keep.", state.getItem('pageUserCheck', ''));
                return false;
            }

            // Review monsters and find attack and fortify button
            for (it = 0, len = buttonsDiv.length; it < len; it += 1) {
                // Make links for easy clickin'
                url = buttonsDiv.eq(it).parent().attr("href");
                if (!(url && url.match(/user=/) && (url.match(/mpool=/) || url.match(/raid\.php/)))) {
                    continue;
                }

                monsterRow = buttonsDiv.eq(it).parents().eq(3);
                monsterFull = $.trim(monsterRow.text());
                monsterName = $.trim(monsterFull.replace(/Completed!/i, '').replace(/Fled!/i, ''));
                monsterReviewed = monster.getItem(monsterName);
                if (monsterReviewed.type === '') {
                    monsterReviewed.type = monster.type(monsterName);
                }

                monsterReviewed.page = page;
                engageButtonName = buttonsDiv.eq(it).attr("src").match(/dragon_list_btn_\d/i)[0];
                switch (engageButtonName) {
                case 'dragon_list_btn_2' :
                    monsterReviewed.status = 'Collect Reward';
                    monsterReviewed.color = 'grey';
                    break;
                case 'dragon_list_btn_3' :
                    monster.engageButtons[monsterName] = buttonsDiv.eq(it).get(0);
                    break;
                case 'dragon_list_btn_4' :
                    if (page === 'raid' && !(/!/.test(monsterFull))) {
                        monster.engageButtons[monsterName] = buttonsDiv.eq(it).get(0);
                        break;
                    }

                    if (!monster.completeButton[page].button && !monster.completeButton[page].name) {
                        monster.completeButton[page].name = monsterName;
                        monster.completeButton[page].button = utility.CheckForImage('cancelButton.gif', monsterRow);
                    }

                    monsterReviewed.status = 'Complete';
                    monsterReviewed.color = 'grey';
                    break;
                default :
                }

                monsterReviewed.userId = url.match(/user=\d+/i)[0].split('=')[1];
                monsterReviewed.mpool = ((url.match(/mpool=\d+/i)) ? '&mpool=' + url.match(/mpool=\d+/i)[0].split('=')[1] : '');
                if (monster.info[monsterReviewed.type] && monster.info[monsterReviewed.type].siege) {
                    siege = "&action=doObjective";
                }

                monsterReviewed.link = "<a href='http://apps.facebook.com/castle_age/" + page + ".php?casuser=" + monsterReviewed.userId + monsterReviewed.mpool + siege + "'>Link</a>";
                monster.setItem(monsterReviewed);
            }

            for (it = 0; it < monster.records.length; it += 1) {
                if (monster.records[it].page === '') {
                    delList.push(monster.records[it].name);
                }
            }

            for (it = 0; it < delList.length; it += 1) {
                monster.deleteItem(delList[it]);
            }

            state.setItem('reviewDone', true);
            this.UpdateDashboard(true);
            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults_fightList: " + err);
            return false;
        }
    },

    CheckResults_viewFight: function () {
        try {
            var missRegEx         = null,
                currentMonster    = {},
                time              = [],
                tempDiv           = null,
                tempText          = '',
                tempArr           = [],
                counter           = 0,
                monstHealthImg    = '',
                totalCount        = 0,
                ind               = 0,
                achLevel          = 0,
                maxDamage         = 0,
                maxToFortify      = 0,
                isTarget          = false,
                KOBenable         = false,
                KOBbiasHours      = 0,
                KOBach            = false,
                KOBmax            = false,
                KOBminFort        = false,
                KOBtmp            = 0,
                KOBtimeLeft       = 0,
                KOBbiasedTF       = 0,
                KOBPercentTimeRemaining = 0,
                KOBtotalMonsterTime = 0,
                monsterDiv        = null,
                actionDiv         = null,
                damageDiv         = null,
                chatDiv           = null,
                chatArr           = [],
                chatHtml          = '',
                appBodyDiv        = null,
                httpRegExp        = new RegExp('.*(http:.*)');

            if (config.getItem("enableTitles", true)) {
                spreadsheet.doTitles();
            }

            appBodyDiv = $("#app46755028429_app_body");
            chatDiv = appBodyDiv.find("#app46755028429_chat_log div[style*='hidden'] div[style*='320px']");
            if (chatDiv && chatDiv.length) {
                chatDiv.each(function () {
                    chatHtml = $.trim($(this).html());
                    if (chatHtml) {
                        chatArr = chatHtml.split("<br>");
                        if (chatArr && chatArr.length === 2) {
                            tempArr = chatArr[1].replace(/"/g, '').match(httpRegExp);
                            if (tempArr && tempArr.length === 2 && tempArr[1]) {
                                tempArr = tempArr[1].split(" ");
                                if (tempArr && tempArr.length) {
                                    tempText = "<a href='" + tempArr[0] + "'>" + tempArr[0] + "</a>";
                                    chatHtml = chatHtml.replace(tempArr[0], tempText);
                                    $(this).html(chatHtml);
                                }
                            }
                        }
                    }
                });
            }

            monsterDiv = appBodyDiv.find("div[style*='dragon_title_owner']");
            if (monsterDiv && monsterDiv.length) {
                tempText = $.trim(monsterDiv.children(":eq(2)").text());
            } else {
                monsterDiv = appBodyDiv.find("div[style*='nm_top']");
                if (monsterDiv && monsterDiv.length) {
                    tempText = $.trim(monsterDiv.children(":eq(0)").children(":eq(0)").text());
                    tempDiv = appBodyDiv.find("div[style*='nm_bars']");
                    if (tempDiv && tempDiv.length) {
                        tempText += ' ' + $.trim(tempDiv.children(":eq(0)").children(":eq(0)").children(":eq(0)").siblings(":last").children(":eq(0)").text()).replace("'s Life", "");
                    } else {
                        utility.warn("Problem finding nm_bars");
                        return;
                    }
                } else {
                    utility.warn("Problem finding dragon_title_owner and nm_top");
                    return;
                }
            }

            if (monsterDiv && monsterDiv.length && monsterDiv.find("img[uid='" + this.stats.FBID + "']").length) {
                utility.log(2, "Your monster found", tempText);
                tempText = tempText.replace(new RegExp(".+?'s "), 'Your ');
            }

            utility.log(2, "Monster name", tempText);
            currentMonster = monster.getItem(tempText);
            if (currentMonster.type === '') {
                currentMonster.type = monster.type(currentMonster.name);
            }

            if (currentMonster.type === 'Siege') {
                tempDiv = appBodyDiv.find("div[style*='raid_back']");
                if (tempDiv && tempDiv.length) {
                    if (tempDiv.find("img[src*='raid_1_large.jpg']").length) {
                        currentMonster.type = 'Raid I';
                    } else if (tempDiv.find("img[src*='raid_b1_large.jpg']").length) {
                        currentMonster.type = 'Raid II';
                    } else if (tempDiv.find("img[src*='raid_1_large_victory.jpg']").length) {
                        utility.log(2, "Siege Victory!");
                    } else {
                        utility.log(2, "Problem finding raid image! Probably finished.");
                    }
                } else {
                    utility.warn("Problem finding raid_back");
                    return;
                }
            }

            currentMonster.review = new Date().getTime();
            state.setItem('monsterRepeatCount', 0);
            // Extract info
            tempDiv = appBodyDiv.find("#app46755028429_monsterTicker");
            if (tempDiv && tempDiv.length) {
                utility.log(4, "Monster ticker found");
                time = tempDiv.text().split(":");
            } else {
                if (!utility.CheckForImage("dead.jpg")) {
                    utility.warn("Could not locate Monster ticker.");
                }
            }

            if (time && time.length === 3 && monster.info[currentMonster.type] && monster.info[currentMonster.type].fort) {
                if (currentMonster.type === "Deathrune" || currentMonster.type === 'Ice Elemental') {
                    currentMonster.fortify = 100;
                } else {
                    currentMonster.fortify = 0;
                }

                switch (monster.info[currentMonster.type].defense_img) {
                case 'bar_dispel.gif' :
                    tempDiv = appBodyDiv.find("img[src*='" + monster.info[currentMonster.type].defense_img + "']");
                    if (tempDiv && tempDiv.length) {
                        currentMonster.fortify = 100 - utility.getElementWidth(tempDiv.parent());
                    } else {
                        utility.warn("Unable to find defense bar", monster.info[currentMonster.type].defense_img);
                    }

                    break;
                case 'seamonster_ship_health.jpg' :
                    tempDiv = appBodyDiv.find("img[src*='" + monster.info[currentMonster.type].defense_img + "']");
                    if (tempDiv && tempDiv.length) {
                        currentMonster.fortify = utility.getElementWidth(tempDiv.parent());
                        if (monster.info[currentMonster.type].repair_img) {
                            tempDiv = appBodyDiv.find("img[src*='" + monster.info[currentMonster.type].repair_img + "']");
                            if (tempDiv && tempDiv.length) {
                                currentMonster.fortify = currentMonster.fortify * (100 / (100 - utility.getElementWidth(tempDiv.parent())));
                            } else {
                                utility.warn("Unable to find repair bar", monster.info[currentMonster.type].repair_img);
                            }
                        }
                    } else {
                        utility.warn("Unable to find defense bar", monster.info[currentMonster.type].defense_img);
                    }

                    break;
                case 'nm_green.jpg' :
                    tempDiv = appBodyDiv.find("img[src*='" + monster.info[currentMonster.type].defense_img + "']");
                    if (tempDiv && tempDiv.length) {
                        currentMonster.fortify = utility.getElementWidth(tempDiv.parent());
                        currentMonster.strength = utility.getElementWidth(tempDiv.parent().parent());
                    } else {
                        utility.warn("Unable to find defense bar", monster.info[currentMonster.type].defense_img);
                    }

                    break;
                default:
                    utility.warn("No match for defense_img", monster.info[currentMonster.type].defense_img);
                }
            }

            // Get damage done to monster
            actionDiv = appBodyDiv.find("#app46755028429_action_logs");
            damageDiv = actionDiv.find("td[class='dragonContainer']:first td[valign='top']:first a[href*='user=" + this.stats.FBID + "']:first");
            if (damageDiv && damageDiv.length) {
                if (monster.info[currentMonster.type] && monster.info[currentMonster.type].defense) {
                    tempArr = $.trim(damageDiv.parent().parent().siblings(":last").text()).match(new RegExp("([0-9,]+) dmg / ([0-9,]+) def"));
                    if (tempArr && tempArr.length === 3) {
                        currentMonster.attacked = utility.NumberOnly(tempArr[1]);
                        currentMonster.defended = utility.NumberOnly(tempArr[2]);
                        currentMonster.damage = currentMonster.attacked + currentMonster.defended;
                    } else {
                        utility.warn("Unable to get attacked and defended damage");
                    }
                } else if (currentMonster.type === 'Siege' || (monster.info[currentMonster.type] && monster.info[currentMonster.type].raid)) {
                    currentMonster.attacked = utility.NumberOnly($.trim(damageDiv.parent().siblings(":last").text()));
                    currentMonster.damage = currentMonster.attacked;
                } else {
                    currentMonster.attacked = utility.NumberOnly($.trim(damageDiv.parent().parent().siblings(":last").text()));
                    currentMonster.damage = currentMonster.attacked;
                }

                damageDiv.parents("tr").eq(0).css('background-color', gm.getItem("HighlightColor", '#C6A56F', hiddenVar));
            } else {
                utility.log(2, "Player hasn't done damage yet");
            }

            if (/:ac\b/.test(currentMonster.conditions) ||
                    (currentMonster.type.match(/Raid/) && config.getItem('raidCollectReward', false)) ||
                    (!currentMonster.type.match(/Raid/) && config.getItem('monsterCollectReward', false))) {

                counter = state.getItem('monsterReviewCounter', -3);
                if (counter >= 0 && monster.records[counter] && monster.records[counter].name === currentMonster.name && ($("a[href*='&action=collectReward']").length || $("input[alt*='Collect Reward']").length)) {
                    utility.log(2, 'Collecting Reward');
                    currentMonster.review = -1;
                    state.setItem('monsterReviewCounter', counter -= 1);
                    currentMonster.status = 'Collect Reward';
                    if (currentMonster.name.indexOf('Siege') >= 0) {
                        if ($("a[href*='&rix=1']").length) {
                            currentMonster.rix = 1;
                        } else {
                            currentMonster.rix = 2;
                        }
                    }
                }
            }

            if (monster.info[currentMonster.type] && monster.info[currentMonster.type].alpha) {
                monstHealthImg = 'nm_red.jpg';
            } else {
                monstHealthImg = 'monster_health_background.jpg';
            }

            monsterDiv = appBodyDiv.find("img[src*='" + monstHealthImg + "']");
            if (time && time.length === 3 && monsterDiv && monsterDiv.length) {
                currentMonster.time = time;
                if (monsterDiv && monsterDiv.length) {
                    utility.log(4, "Found monster health div");
                    currentMonster.life = utility.getElementWidth(monsterDiv.parent());
                } else {
                    utility.warn("Could not find monster health div.");
                }

                if (currentMonster.life) {
                    if (!monster.info[currentMonster.type]) {
                        monster.setItem(currentMonster);
                        utility.warn('Unknown monster');
                        return;
                    }
                }

                if (damageDiv && damageDiv.length && monster.info[currentMonster.type] && monster.info[currentMonster.type].alpha) {
                    // Character type stuff
                    monsterDiv = appBodyDiv.find("div[style*='nm_bottom']");
                    if (monsterDiv && monsterDiv.length) {
                        tempText = $.trim(monsterDiv.children().eq(0).children().text()).replace(new RegExp("[\\s\\s]+", 'g'), ' ');
                        if (tempText) {
                            utility.log(4, "Character class text", tempText);
                            tempArr = tempText.match(/Class: (\w+) /);
                            if (tempArr && tempArr.length === 2) {
                                currentMonster.charClass = tempArr[1];
                                utility.log(3, "character", currentMonster.charClass);
                            } else {
                                utility.warn("Can't get character", tempArr);
                            }

                            tempArr = tempText.match(/Tip: ([\w ]+) Status/);
                            if (tempArr && tempArr.length === 2) {
                                currentMonster.tip = tempArr[1];
                                utility.log(3, "tip", currentMonster.tip);
                            } else {
                                utility.warn("Can't get tip", tempArr);
                            }

                            tempArr = tempText.match(/Status Time Remaining: ([0-9]+):([0-9]+):([0-9]+)\s*/);
                            if (tempArr && tempArr.length === 4) {
                                currentMonster.stunTime = new Date().getTime() + (tempArr[1] * 60 * 60 * 1000) + (tempArr[2] * 60 * 1000) + (tempArr[3] * 1000);
                                utility.log(3, "statusTime", currentMonster.stunTime);
                            } else {
                                utility.warn("Can't get statusTime", tempArr);
                            }

                            tempDiv = monsterDiv.find("img[src*='nm_stun_bar']");
                            if (tempDiv && tempDiv.length) {
                                tempText = utility.getElementWidth(tempDiv);
                                utility.log(4, "Stun bar percent text", tempText);
                                if (tempText) {
                                    currentMonster.stun = utility.NumberOnly(tempText);
                                    utility.log(3, "stun", currentMonster.stun);
                                } else {
                                    utility.warn("Can't get stun bar width");
                                }
                            } else {
                                tempArr = currentMonster.tip.split(" ");
                                if (tempArr && tempArr.length) {
                                    tempText = tempArr[tempArr.length - 1].toLowerCase();
                                    tempArr = ["strengthen", "heal"];
                                    if (tempText && tempArr.indexOf(tempText) >= 0) {
                                        if (tempText === tempArr[0]) {
                                            currentMonster.stun = currentMonster.strength;
                                        } else if (tempText === tempArr[1]) {
                                            currentMonster.stun = currentMonster.health;
                                        } else {
                                            utility.warn("Expected strengthen or heal to match!", tempText);
                                        }
                                    } else {
                                        utility.warn("Expected strengthen or heal from tip!", tempText);
                                    }
                                } else {
                                    utility.warn("Can't get stun bar and unexpected tip!", currentMonster.tip);
                                }
                            }

                            if (currentMonster.charClass && currentMonster.tip && currentMonster.stun !== -1) {
                                currentMonster.stunDo = new RegExp(currentMonster.charClass).test(currentMonster.tip) && currentMonster.stun < 100;
                                currentMonster.stunType = '';
                                if (currentMonster.stunDo) {
                                    utility.log(2, "Do character specific attack", currentMonster.stunDo);
                                    tempArr = currentMonster.tip.split(" ");
                                    if (tempArr && tempArr.length) {
                                        tempText = tempArr[tempArr.length - 1].toLowerCase();
                                        tempArr = ["strengthen", "cripple", "heal", "deflection"];
                                        if (tempText && tempArr.indexOf(tempText) >= 0) {
                                            currentMonster.stunType = tempText.replace("ion", '');
                                            utility.log(2, "Character specific attack type", currentMonster.stunType);
                                        } else {
                                            utility.warn("Type does match list!", tempText);
                                        }
                                    } else {
                                        utility.warn("Unable to get type from tip!", currentMonster);
                                    }
                                } else {
                                    utility.log(2, "Tip does not match class or stun maxed", currentMonster);
                                }
                            } else {
                                utility.warn("Missing 'class', 'tip' or 'stun'", currentMonster);
                            }
                        } else {
                            utility.warn("Missing tempText");
                        }
                    } else {
                        utility.warn("Missing nm_bottom");
                    }
                }

                if (monster.info[currentMonster.type] && monster.info[currentMonster.type].siege) {
                    missRegEx = new RegExp(".*Need (\\d+) more.*");
                    if (monster.info[currentMonster.type].alpha) {
                        currentMonster.miss = $.trim(appBodyDiv.find("div[style*='nm_bottom']").children(":last").children(":last").children(":last").children(":last").text()).replace(missRegEx, "$1");
                    } else if (currentMonster.type.indexOf('Raid') >= 0) {
                        tempDiv = appBodyDiv.find("img[src*='" + monster.info[currentMonster.type].siege_img + "']");
                        currentMonster.miss = $.trim(tempDiv.parent().parent().text()).replace(missRegEx, "$1");
                    } else {
                        currentMonster.miss = $.trim(actionDiv.prev().children().eq(3).children().eq(2).children().eq(1).text()).replace(missRegEx, "$1");
                    }

                    if (currentMonster.type.indexOf('Raid') >= 0) {
                        totalCount = utility.NumberOnly(utility.getHTMLPredicate(tempDiv.attr("src")));
                    } else {
                        totalCount = 1;
                        for (ind = 0; ind < monster.info[currentMonster.type].siege_img.length; ind += 1) {
                            totalCount += appBodyDiv.find("img[src*=" + monster.info[currentMonster.type].siege_img[ind] + "]").size();
                        }
                    }

                    currentMonster.phase = Math.min(totalCount, monster.info[currentMonster.type].siege);
                    if (isNaN(currentMonster.miss)) {
                        currentMonster.miss = 0;
                    }
                }

                if (monster.info[currentMonster.type]) {
                    currentMonster.t2k = monster.t2kCalc(currentMonster);
                }
            } else {
                utility.log(2, 'Monster is dead or fled');
                currentMonster.color = 'grey';
                if (currentMonster.status !== 'Complete' && currentMonster.status !== 'Collect Reward') {
                    currentMonster.status = "Dead or Fled";
                }

                state.setItem('resetselectMonster', true);
                monster.setItem(currentMonster);
                return;
            }

            if (damageDiv && damageDiv.length) {
                achLevel = monster.parseCondition('ach', currentMonster.conditions);
                if (monster.info[currentMonster.type] && achLevel === false) {
                    achLevel = monster.info[currentMonster.type].ach;
                }

                maxDamage = monster.parseCondition('max', currentMonster.conditions);
                maxToFortify = (monster.parseCondition('f%', currentMonster.conditions) !== false) ? monster.parseCondition('f%', currentMonster.conditions) : config.getItem('MaxToFortify', 0);
                if (currentMonster.name === state.getItem('targetFromfortify', new monster.energyTarget().data).name && state.getItem('targetFromfortify', {}).type === 'Fortify' && currentMonster.fortify > maxToFortify) {
                    state.setItem('resetselectMonster', true);
                }

                if (currentMonster.name === state.getItem('targetFromfortify', new monster.energyTarget().data).name && state.getItem('targetFromfortify', {}).type === 'Strengthen' && currentMonster.strength >= 100) {
                    state.setItem('resetselectMonster', true);
                }

                if (currentMonster.name === state.getItem('targetFromfortify', new monster.energyTarget().data).name && state.getItem('targetFromfortify', {}).type === 'Stun' && !currentMonster.stunDo) {
                    state.setItem('resetselectMonster', true);
                }

                // Start of Keep On Budget (KOB) code Part 1 -- required variables
                utility.log(2, 'Start of Keep On Budget (KOB) Code');

                //default is disabled for everything
                KOBenable = false;

                //default is zero bias hours for everything
                KOBbiasHours = 0;

                //KOB needs to follow achievment mode for this monster so that KOB can be skipped.
                KOBach = false;

                //KOB needs to follow max mode for this monster so that KOB can be skipped.
                KOBmax = false;

                //KOB needs to follow minimum fortification state for this monster so that KOB can be skipped.
                KOBminFort = false;

                //create a temp variable so we don't need to call parseCondition more than once for each if statement
                KOBtmp = monster.parseCondition('kob', currentMonster.conditions);
                if (isNaN(KOBtmp)) {
                    utility.log(2, 'KOB NaN branch');
                    KOBenable = true;
                    KOBbiasHours = 0;
                } else if (!KOBtmp) {
                    utility.log(2, 'KOB false branch');
                    KOBenable = false;
                    KOBbiasHours = 0;
                } else {
                    utility.log(2, 'KOB passed value branch');
                    KOBenable = true;
                    KOBbiasHours = KOBtmp;
                }

                //test if user wants kob active globally
                if (!KOBenable && gm.getItem('KOBAllMonters', false, hiddenVar)) {
                    KOBenable = true;
                }

                //disable kob if in level up mode or if we are within 5 stamina of max potential stamina
                if (this.InLevelUpMode() || this.stats.stamina.num >= this.stats.stamina.max - 5) {
                    KOBenable = false;
                }

                if (KOBenable) {
                    utility.log(2, 'Level Up Mode: ', this.InLevelUpMode());
                    utility.log(2, 'Stamina Avail: ', this.stats.stamina.num);
                    utility.log(2, 'Stamina Max: ', this.stats.stamina.max);

                    //log results of previous two tests
                    utility.log(2, 'KOBenable: ', KOBenable);
                    utility.log(2, 'KOB Bias Hours: ', KOBbiasHours);
                }

                //Total Time alotted for monster
                KOBtotalMonsterTime = monster.info[currentMonster.type].duration;
                if (KOBenable) {
                    utility.log(2, 'Total Time for Monster: ', KOBtotalMonsterTime);

                    //Total Damage remaining
                    utility.log(2, 'HP left: ', currentMonster.life);
                }

                //Time Left Remaining
                KOBtimeLeft = parseInt(time[0], 10) + (parseInt(time[1], 10) * 0.0166);
                if (KOBenable) {
                    utility.log(2, 'TimeLeft: ', KOBtimeLeft);
                }

                //calculate the bias offset for time remaining
                KOBbiasedTF = KOBtimeLeft - KOBbiasHours;

                //for 7 day monsters we want kob to not permit attacks (beyond achievement level) for the first 24 to 48 hours
                // -- i.e. reach achievement and then wait for more players and siege assist clicks to catch up
                if (KOBtotalMonsterTime >= 168) {
                    KOBtotalMonsterTime = KOBtotalMonsterTime - gm.getItem('KOBDelayStart', 48, hiddenVar);
                }

                //Percentage of time remaining for the currently selected monster
                KOBPercentTimeRemaining = Math.round(KOBbiasedTF / KOBtotalMonsterTime * 1000) / 10;
                if (KOBenable) {
                    utility.log(2, 'Percent Time Remaining: ', KOBPercentTimeRemaining);
                }

                // End of Keep On Budget (KOB) code Part 1 -- required variables

                isTarget = (currentMonster.name === state.getItem('targetFromraid', '') ||
                            currentMonster.name === state.getItem('targetFrombattle_monster', '') ||
                            currentMonster.name === state.getItem('targetFromfortify', new monster.energyTarget().data).name);

                if (maxDamage && currentMonster.damage >= maxDamage) {
                    currentMonster.color = 'red';
                    currentMonster.over = 'max';
                    //used with KOB code
                    KOBmax = true;
                    //used with kob debugging
                    if (KOBenable) {
                        utility.log(2, 'KOB - max activated');
                    }

                    if (isTarget) {
                        state.setItem('resetselectMonster', true);
                    }
                } else if (currentMonster.fortify !== -1 && currentMonster.fortify < config.getItem('MinFortToAttack', 1)) {
                    currentMonster.color = 'purple';
                    //used with KOB code
                    KOBminFort = true;
                    //used with kob debugging
                    if (KOBenable) {
                        utility.log(2, 'KOB - MinFort activated');
                    }

                    if (isTarget) {
                        state.setItem('resetselectMonster', true);
                    }
                } else if (currentMonster.damage >= achLevel && (config.getItem('AchievementMode', false) || monster.parseCondition('ach', currentMonster.conditions))) {
                    currentMonster.color = 'darkorange';
                    currentMonster.over = 'ach';
                    //used with KOB code
                    KOBach = true;
                    //used with kob debugging
                    if (KOBenable) {
                        utility.log(2, 'KOB - achievement reached');
                    }

                    if (isTarget && currentMonster.damage < achLevel) {
                        state.setItem('resetselectMonster', true);
                    }
                }

                //Start of KOB code Part 2 begins here
                if (KOBenable && !KOBmax && !KOBminFort && KOBach && currentMonster.life < KOBPercentTimeRemaining) {
                    //kob color
                    currentMonster.color = 'magenta';
                    // this line is required or we attack anyway.
                    currentMonster.over = 'max';
                    //used with kob debugging
                    if (KOBenable) {
                        utility.log(2, 'KOB - budget reached');
                    }

                    if (isTarget) {
                        state.setItem('resetselectMonster', true);
                        utility.log(1, 'This monster no longer a target due to kob');
                    }
                } else {
                    if (!KOBmax && !KOBminFort && !KOBach) {
                        //the way that the if statements got stacked, if it wasn't kob it was painted black anyway
                        //had to jump out the black paint if max, ach or fort needed to paint the entry.
                        currentMonster.color = 'black';
                    }
                }
                //End of KOB code Part 2 stops here.
            } else {
                currentMonster.color = 'black';
            }

            monster.setItem(currentMonster);
            this.UpdateDashboard(true);
            if (schedule.check('battleTimer')) {
                window.setTimeout(function () {
                    caap.SetDivContent('monster_mess', '');
                }, 2000);
            }
        } catch (err) {
            utility.error("ERROR in CheckResults_viewFight: " + err);
        }
    },

    /*-------------------------------------------------------------------------------------\
    GuildMonsterReview is a primary action subroutine to mange the guild monster on the dashboard
    \-------------------------------------------------------------------------------------*/
    GuildMonsterReview: function () {
        try {
            /*-------------------------------------------------------------------------------------\
            We do guild monster review once an hour.  Some routines may reset this timer to drive
            GuildMonsterReview immediately.
            \-------------------------------------------------------------------------------------*/
            if (!schedule.check("guildMonsterReview") || config.getItem('WhenGuildMonster', 'Never') === 'Never') {
                return false;
            }

            if (!this.stats.guild.id) {
                utility.log(2, "Going to guild to get Guild Id");
                if (utility.NavigateTo('guild')) {
                    return true;
                }
            }

            /*
            if (!this.stats.guild.id) {
                utility.log(2, "Going to keep to get Guild Id");
                if (utility.NavigateTo('keep')) {
                    return true;
                }
            }
            */

            var record = {},
                url    = '',
                objective = '';

            if (state.getItem('guildMonsterBattlesRefresh', true)) {
                if (guild_monster.navigate_to_battles_refresh()) {
                    return true;
                }
            }

            if (!state.getItem('guildMonsterBattlesReview', false)) {
                if (guild_monster.navigate_to_battles()) {
                    return true;
                }

                state.setItem('guildMonsterBattlesReview', true);
            }

            record = guild_monster.getReview();
            if (record && $.isPlainObject(record) && !$.isEmptyObject(record)) {
                utility.log(1, "Reviewing Slot (" + record.slot + ") Name: " + record.name);
                if (this.stats.staminaT.num > 0 && config.getItem("doGuildMonsterSiege", true)) {
                    objective = "&action=doObjective";
                }

                url = "guild_battle_monster.php?twt2=" + record.name.replace(/ /g, '_') + "&guild_id=" + record.guildId + objective + "&slot=" + record.slot + "&ref=nf";
                state.setItem('guildMonsterReviewSlot', record.slot);
                utility.ClickAjaxLinkSend(url);
                return true;
            }

            schedule.setItem("guildMonsterReview", gm.getItem('guildMonsterReviewMins', 60, hiddenVar) * 60, 300);
            state.setItem('guildMonsterBattlesRefresh', true);
            state.setItem('guildMonsterBattlesReview', false);
            state.setItem('guildMonsterReviewSlot', 0);
            guild_monster.select(true);
            utility.log(1, 'Done with guild monster review.');
            return false;
        } catch (err) {
            utility.error("ERROR in GuildMonsterReview: " + err);
            return false;
        }
    },

    /*-------------------------------------------------------------------------------------\
    MonsterReview is a primary action subroutine to mange the monster and raid list
    on the dashboard
    \-------------------------------------------------------------------------------------*/
    MonsterReview: function () {
        try {
            /*-------------------------------------------------------------------------------------\
            We do monster review once an hour.  Some routines may reset this timer to drive
            MonsterReview immediately.
            \-------------------------------------------------------------------------------------*/
            if (!schedule.check("monsterReview") || (config.getItem('WhenMonster', 'Never') === 'Never' && config.getItem('WhenBattle', 'Never') === 'Never')) {
                return false;
            }

            /*-------------------------------------------------------------------------------------\
            We get the monsterReviewCounter.  This will be set to -3 if we are supposed to refresh
            the monsterOl completely. Otherwise it will be our index into how far we are into
            reviewing monsterOl.
            \-------------------------------------------------------------------------------------*/
            var counter  = state.getItem('monsterReviewCounter', -3),
                link     = '',
                tempTime = 0,
                isSiege  = false;

            if (counter === -3) {
                state.setItem('monsterReviewCounter', counter += 1);
                return true;
            }

            if (counter === -2) {
                if (this.stats.level > 6) {
                    if (utility.NavigateTo('keep,battle_monster', 'tab_monster_list_on.gif')) {
                        state.setItem('reviewDone', false);
                        return true;
                    }
                } else {
                    utility.log(1, "Monsters: Unlock at level 7");
                    state.setItem('reviewDone', true);
                }

                if (state.getItem('reviewDone', true)) {
                    state.setItem('monsterReviewCounter', counter += 1);
                } else {
                    return true;
                }
            }

            if (counter === -1) {
                if (this.stats.level > 7) {
                    if (utility.NavigateTo(this.battlePage + ',raid', 'tab_raid_on.gif')) {
                        state.setItem('reviewDone', false);
                        return true;
                    }
                } else {
                    utility.log(1, "Raids: Unlock at level 8");
                    state.setItem('reviewDone', true);
                }

                if (state.getItem('reviewDone', true)) {
                    state.setItem('monsterReviewCounter', counter += 1);
                } else {
                    return true;
                }
            }

            if (monster.records && monster.records.length === 0) {
                return false;
            }

            /*-------------------------------------------------------------------------------------\
            Now we step through the monsterOl objects. We set monsterReviewCounter to the next
            index for the next reiteration since we will be doing a click and return in here.
            \-------------------------------------------------------------------------------------*/
            while (counter < monster.records.length) {
                if (!monster.records[counter]) {
                    state.setItem('monsterReviewCounter', counter += 1);
                    continue;
                }
                /*-------------------------------------------------------------------------------------\
                If we looked at this monster more recently than an hour ago, skip it
                \-------------------------------------------------------------------------------------*/
                if (monster.records[counter].color === 'grey' && monster.records[counter].life !== -1) {
                    monster.records[counter].life = -1;
                    monster.records[counter].fortify = -1;
                    monster.records[counter].strength = -1;
                    monster.records[counter].time = [];
                    monster.records[counter].t2k = -1;
                    monster.records[counter].phase = '';
                    monster.save();
                }

                tempTime = monster.records[counter].review ? monster.records[counter].review : -1;
                utility.log(3, "Review", monster.records[counter], !schedule.since(tempTime, gm.getItem("MonsterLastReviewed", 15, hiddenVar) * 60));
                if (monster.records[counter].status === 'Complete' || !schedule.since(tempTime, gm.getItem("MonsterLastReviewed", 15, hiddenVar) * 60) || state.getItem('monsterRepeatCount', 0) > 2) {
                    state.setItem('monsterReviewCounter', counter += 1);
                    state.setItem('monsterRepeatCount', 0);
                    continue;
                }
                /*-------------------------------------------------------------------------------------\
                We get our monster link
                \-------------------------------------------------------------------------------------*/
                this.SetDivContent('monster_mess', 'Reviewing/sieging ' + (counter + 1) + '/' + monster.records.length + ' ' + monster.records[counter].name);
                link = monster.records[counter].link;
                /*-------------------------------------------------------------------------------------\
                If the link is good then we get the url and any conditions for monster
                \-------------------------------------------------------------------------------------*/
                if (/href/.test(link)) {
                    link = link.split("'")[1];
                    /*-------------------------------------------------------------------------------------\
                    If the autocollect token was specified then we set the link to do auto collect. If
                    the conditions indicate we should not do sieges then we fix the link.
                    \-------------------------------------------------------------------------------------*/
                    isSiege = monster.records[counter].type.match(/Raid/) || monster.records[counter].type === 'Siege';
                    utility.log(3, "monster.records[counter]", monster.records[counter]);
                    if (((monster.records[counter].conditions && /:ac\b/.test(monster.records[counter].conditions)) ||
                            (isSiege && config.getItem('raidCollectReward', false)) ||
                            (!isSiege && config.getItem('monsterCollectReward', false))) && monster.records[counter].status === 'Collect Reward') {

                        if (general.Select('CollectGeneral')) {
                            return true;
                        }

                        link += '&action=collectReward';
                        if (monster.records[counter].name.indexOf('Siege') >= 0) {
                            if (monster.records[counter].rix !== -1)  {
                                link += '&rix=' + monster.records[counter].rix;
                            } else {
                                link += '&rix=2';
                            }
                        }

                        link = link.replace('&action=doObjective', '');
                        state.setItem('CollectedRewards', true);
                    } else if ((monster.records[counter].conditions && monster.records[counter].conditions.match(':!s')) ||
                               (!config.getItem('raidDoSiege', true) && isSiege) ||
                               (!config.getItem('monsterDoSiege', true) && !isSiege && monster.info[monster.records[counter].type].siege) ||
                               this.stats.stamina.num === 0) {
                        utility.log(2, "Do not siege");
                        link = link.replace('&action=doObjective', '');
                    }
                    /*-------------------------------------------------------------------------------------\
                    Now we use ajaxSendLink to display the monsters page.
                    \-------------------------------------------------------------------------------------*/
                    utility.log(1, 'Reviewing ' + (counter + 1) + '/' + monster.records.length + ' ' + monster.records[counter].name);
                    state.setItem('ReleaseControl', true);
                    link = link.replace('http://apps.facebook.com/castle_age/', '').replace('?', '?twt2&');
                    utility.log(5, "Link", link);
                    utility.ClickAjaxLinkSend(link);
                    state.setItem('monsterRepeatCount', state.getItem('monsterRepeatCount', 0) + 1);
                    state.setItem('resetselectMonster', true);
                    return true;
                }
            }
            /*-------------------------------------------------------------------------------------\
            All done.  Set timer and tell monster.select and dashboard they need to do thier thing.
            We set the monsterReviewCounter to do a full refresh next time through.
            \-------------------------------------------------------------------------------------*/
            schedule.setItem("monsterReview", gm.getItem('monsterReviewMins', 60, hiddenVar) * 60, 300);
            state.setItem('resetselectMonster', true);
            state.setItem('monsterReviewCounter', -3);
            utility.log(1, 'Done with monster/raid review.');
            this.SetDivContent('monster_mess', '');
            this.UpdateDashboard(true);
            if (state.getItem('CollectedRewards', false)) {
                state.setItem('CollectedRewards', false);
                monster.flagReview();
            }

            return true;
        } catch (err) {
            utility.error("ERROR in MonsterReview: " + err);
            return false;
        }
    },

    Monsters: function () {
        try {
            if (config.getItem('WhenMonster', 'Never') === 'Never') {
                this.SetDivContent('monster_mess', 'Monster off');
                return false;
            }

            ///////////////// Reivew/Siege all monsters/raids \\\\\\\\\\\\\\\\\\\\\\

            if (config.getItem('WhenMonster', 'Never') === 'Stay Hidden' && this.NeedToHide() && this.CheckStamina('Monster', 1)) {
                utility.log(1, "Stay Hidden Mode: We're not safe. Go battle.");
                this.SetDivContent('monster_mess', 'Not Safe For Monster. Battle!');
                return false;
            }

            if (!schedule.check('NotargetFrombattle_monster')) {
                return false;
            }

            ///////////////// Individual Monster Page \\\\\\\\\\\\\\\\\\\\\\

            // Establish a delay timer when we are 1 stamina below attack level.
            // Timer includes 5 min for stamina tick plus user defined random interval
            if (!this.InLevelUpMode() && this.stats.stamina.num === (state.getItem('MonsterStaminaReq', 1) - 1) && schedule.check('battleTimer') && config.getItem('seedTime', 0) > 0) {
                schedule.setItem('battleTimer', 300, config.getItem('seedTime', 0));
                this.SetDivContent('monster_mess', 'Monster Delay Until ' + schedule.display('battleTimer'));
                return false;
            }

            if (!schedule.check('battleTimer')) {
                if (this.stats.stamina.num < general.GetStaminaMax(config.getItem('IdleGeneral', 'Use Current'))) {
                    this.SetDivContent('monster_mess', 'Monster Delay Until ' + schedule.display('battleTimer'));
                    return false;
                }
            }

            var fightMode        = '',
                monsterName      = state.getItem('targetFromfortify', new monster.energyTarget().data).name,
                monstType        = monster.type(monsterName),
                nodeNum          = 0,
                energyRequire    = 10,
                currentMonster   = monster.getItem(monsterName),
                imageTest        = '',
                attackButton     = null,
                singleButtonList = [],
                buttonList       = [],
                tacticsValue     = 0,
                useTactics       = false,
                attackMess       = '',
                it               = 0,
                len              = 0,
                buttonHref       = '';

            if (monstType) {
                if (!this.InLevelUpMode() && config.getItem('PowerFortifyMax', false) && monster.info[monstType].staLvl) {
                    for (nodeNum = monster.info[monstType].staLvl.length - 1; nodeNum >= 0; nodeNum -= 1) {
                        if (this.stats.stamina.max >= monster.info[monstType].staLvl[nodeNum]) {
                            break;
                        }
                    }
                }

                if (nodeNum >= 0 && nodeNum !== null && nodeNum !== undefined && config.getItem('PowerAttackMax', false) && monster.info[monstType].nrgMax) {
                    energyRequire = monster.info[monstType].nrgMax[nodeNum];
                }
            }

            utility.log(3, "Energy Required/Node", energyRequire, nodeNum);
            switch (config.getItem('FortifyGeneral', 'Use Current')) {
            case 'Orc King':
                energyRequire = energyRequire * (general.GetLevel('Orc King') + 1);
                utility.log(2, 'Monsters Fortify:Orc King', energyRequire);
                break;
            case 'Barbarus':
                energyRequire = energyRequire * (general.GetLevel('Barbarus') === 4 ? 3 : 2);
                utility.log(2, 'Monsters Fortify:Barbarus', energyRequire);
                break;
            default:
            }

            // Check to see if we should fortify or attack monster
            if (monsterName && this.CheckEnergy(energyRequire, gm.getItem('WhenFortify', 'Energy Available', hiddenVar), 'fortify_mess')) {
                fightMode = 'Fortify';
            } else {
                monsterName = state.getItem('targetFrombattle_monster', '');
                monstType = monster.type(monsterName);
                currentMonster = monster.getItem(monsterName);
                if (monsterName && this.CheckStamina('Monster', state.getItem('MonsterStaminaReq', 1)) && currentMonster.page === 'battle_monster') {
                    fightMode = 'Monster';
                } else {
                    schedule.setItem('NotargetFrombattle_monster', 60);
                    return false;
                }
            }

            // Set right general
            if (general.Select(fightMode + 'General')) {
                return true;
            }

            // Check if on engage monster page
            imageTest = 'dragon_title_owner';
            if (monstType && monster.info[monstType].alpha) {
                imageTest = 'nm_top';
            }

            if ($("div[style*='" + imageTest + "']").length) {
                if (monster.ConfirmRightPage(monsterName)) {
                    return true;
                }

                singleButtonList = [
                    'button_nm_p_attack.gif',
                    'attack_monster_button.jpg',
                    'event_attack1.gif',
                    'seamonster_attack.gif',
                    'event_attack2.gif',
                    'attack_monster_button2.jpg'
                ];

                // Find the attack or fortify button
                if (fightMode === 'Fortify') {
                    buttonList = [
                        'seamonster_fortify.gif',
                        'button_dispel.gif',
                        'attack_monster_button3.jpg'
                    ];

                    if (currentMonster && currentMonster.stunDo && currentMonster.stunType !== '') {
                        buttonList.unshift("button_nm_s_" + currentMonster.stunType);
                    } else {
                        buttonList.unshift("button_nm_s_");
                    }

                    utility.log(3, "monster/button list", currentMonster, buttonList);
                } else if (state.getItem('MonsterStaminaReq', 1) === 1) {
                    // not power attack only normal attacks
                    buttonList = singleButtonList;
                } else {
                    if (currentMonster.conditions && currentMonster.conditions.match(/:tac/i) && this.stats.level >= 50) {
                        useTactics = true;
                        tacticsValue = monster.parseCondition("tac%", currentMonster.conditions);
                    } else if (config.getItem('UseTactics', false) && this.stats.level >= 50) {
                        useTactics = true;
                        tacticsValue = config.getItem('TacticsThreshold', false);
                    }

                    if (tacticsValue !== false && currentMonster.fortify && currentMonster.fortify < tacticsValue) {
                        utility.log(2, "Party health is below threshold value", currentMonster.fortify, tacticsValue);
                        useTactics = false;
                    }

                    if (useTactics && utility.CheckForImage('nm_button_tactics.gif')) {
                        utility.log(2, "Attacking monster using tactics buttons");
                        buttonList = ['nm_button_tactics.gif'].concat(singleButtonList);
                    } else {
                        utility.log(2, "Attacking monster using regular buttons");
                        // power attack or if not seamonster power attack or if not regular attack -
                        // need case for seamonster regular attack?
                        buttonList = [
                            'button_nm_p_power',
                            'button_nm_p_',
                            'power_button_',
                            'attack_monster_button2.jpg',
                            'event_attack2.gif',
                            'seamonster_power.gif',
                            'event_attack1.gif',
                            'attack_monster_button.jpg'
                        ].concat(singleButtonList);
                    }
                }

                nodeNum = 0;
                if (!this.InLevelUpMode()) {
                    if (((fightMode === 'Fortify' && config.getItem('PowerFortifyMax', false)) || (fightMode !== 'Fortify' && config.getItem('PowerAttack', false) && config.getItem('PowerAttackMax', false))) && monster.info[monstType].staLvl) {
                        for (nodeNum = monster.info[monstType].staLvl.length - 1; nodeNum >= 0; nodeNum -= 1) {
                            if (this.stats.stamina.max >= monster.info[monstType].staLvl[nodeNum]) {
                                break;
                            }
                        }
                    }
                }

                for (it = 0, len = buttonList.length; it < len; it += 1) {
                    attackButton = utility.CheckForImage(buttonList[it], null, null, nodeNum);
                    if (attackButton) {
                        break;
                    }
                }

                if (attackButton) {
                    if (fightMode === 'Fortify') {
                        attackMess = 'Fortifying ' + monsterName;
                    } else if (useTactics) {
                        attackMess = 'Tactic Attacking ' + monsterName;
                    } else {
                        attackMess = (state.getItem('MonsterStaminaReq', 1) >= 5 ? 'Power' : 'Single') + ' Attacking ' + monsterName;
                    }

                    utility.log(1, attackMess);
                    this.SetDivContent('monster_mess', attackMess);
                    state.setItem('ReleaseControl', true);
                    utility.Click(attackButton);
                    return true;
                } else {
                    utility.warn('No button to attack/fortify with.');
                    schedule.setItem('NotargetFrombattle_monster', 60);
                    return false;
                }
            }

            ///////////////// Check For Monster Page \\\\\\\\\\\\\\\\\\\\\\
            if (utility.NavigateTo('keep,battle_monster', 'tab_monster_list_on.gif')) {
                return true;
            }

            buttonHref = $("img[src*='dragon_list_btn_']").eq(0).parent().attr("href");
            if (state.getItem('pageUserCheck', '') && (!buttonHref || !buttonHref.match('user=' + this.stats.FBID) || !buttonHref.match(/alchemy\.php/))) {
                utility.log(2, "On another player's keep.", state.getItem('pageUserCheck', ''));
                return utility.NavigateTo('keep,battle_monster', 'tab_monster_list_on.gif');
            }

            if (config.getItem('clearCompleteMonsters', false) && monster.completeButton.battle_monster.button && monster.completeButton.battle_monster.name) {
                utility.Click(monster.completeButton.battle_monster.button);
                monster.deleteItem(monster.completeButton.battle_monster.name);
                monster.completeButton.battle_monster = {};
                this.UpdateDashboard(true);
                utility.log(1, 'Cleared a completed monster');
                return true;
            }

            if (monster.engageButtons[monsterName]) {
                this.SetDivContent('monster_mess', 'Opening ' + monsterName);
                utility.Click(monster.engageButtons[monsterName]);
                return true;
            } else {
                schedule.setItem('NotargetFrombattle_monster', 60);
                utility.warn('No "Engage" button for ', monsterName);
                return false;
            }
        } catch (err) {
            utility.error("ERROR in Monsters: " + err);
            return false;
        }
    },

    /////////////////////////////////////////////////////////////////////
    //                          COMMON FIGHTING FUNCTIONS
    /////////////////////////////////////////////////////////////////////

    demi: {
        ambrosia : {
            power : {
                total : 0,
                max   : 0,
                next  : 0
            },
            daily : {
                num : 0,
                max : 0,
                dif : 0
            }
        },
        malekus : {
            power : {
                total : 0,
                max   : 0,
                next  : 0
            },
            daily : {
                num : 0,
                max : 0,
                dif : 0
            }
        },
        corvintheus : {
            power : {
                total : 0,
                max   : 0,
                next  : 0
            },
            daily : {
                num : 0,
                max : 0,
                dif : 0
            }
        },
        aurora : {
            power : {
                total : 0,
                max   : 0,
                next  : 0
            },
            daily : {
                num : 0,
                max : 0,
                dif : 0
            }
        },
        azeron : {
            power : {
                total : 0,
                max   : 0,
                next  : 0
            },
            daily : {
                num : 0,
                max : 0,
                dif : 0
            }
        }
    },

    LoadDemi: function () {
        if (gm.getItem('demipoint.records', 'default') === 'default' || !$.isPlainObject(gm.getItem('demipoint.records', 'default'))) {
            gm.setItem('demipoint.records', this.demi);
        } else {
            $.extend(true, this.demi, gm.getItem('demipoint.records', this.demi));
        }

        utility.log(4, 'Demi', this.demi);
        state.setItem("UserDashUpdate", true);
    },

    SaveDemi: function () {
        gm.setItem('demipoint.records', this.demi);
        utility.log(4, 'Demi', this.demi);
        state.setItem("UserDashUpdate", true);
    },

    demiTable: {
        0 : 'ambrosia',
        1 : 'malekus',
        2 : 'corvintheus',
        3 : 'aurora',
        4 : 'azeron'
    },

    CheckResults_battle: function () {
        try {
            var symDiv  = null,
                points  = [],
                success = true;

            symDiv = $("#app46755028429_app_body img[src*='symbol_tiny_']").not("img[src*='rewards.jpg']");
            if (symDiv && symDiv.length === 5) {
                symDiv.each(function (index) {
                    var temp = $(this).parent().parent().next().text().replace(/\s/g, '');
                    if (temp) {
                        points.push(temp);
                    } else {
                        success = false;
                        utility.warn('Demi temp text problem', temp);
                    }
                });

                utility.log(3, 'Points', points);
                if (success) {
                    this.demi.ambrosia.daily = this.GetStatusNumbers(points[0]);
                    this.demi.malekus.daily = this.GetStatusNumbers(points[1]);
                    this.demi.corvintheus.daily = this.GetStatusNumbers(points[2]);
                    this.demi.aurora.daily = this.GetStatusNumbers(points[3]);
                    this.demi.azeron.daily = this.GetStatusNumbers(points[4]);
                    schedule.setItem("battle", gm.getItem('CheckDemi', 6, hiddenVar) * 3600, 300);
                    this.SaveDemi();
                }
            } else {
                utility.warn('Demi symDiv problem', symDiv);
            }

            return true;
        } catch (err) {
            utility.error("ERROR in CheckResults_battle: " + err);
            return false;
        }
    },

    DemiPoints: function () {
        try {
            if (this.stats.level < 9) {
                return false;
            }

            if (!config.getItem('DemiPointsFirst', false) || config.getItem('WhenMonster', 'Never') === 'Never') {
                return false;
            }

            if (schedule.check("battle")) {
                utility.log(4, 'DemiPointsFirst battle page check');
                if (utility.NavigateTo(this.battlePage, 'battle_on.gif')) {
                    return true;
                }
            }

            var demiPointsDone = battle.selectedDemisDone();
            utility.log(5, 'DemiPointsDone', demiPointsDone);
            state.setItem("DemiPointsDone", demiPointsDone);
            if (!demiPointsDone) {
                return this.Battle('DemiPoints');
            } else {
                return false;
            }
        } catch (err) {
            utility.error("ERROR in DemiPoints: " + err);
            return false;
        }
    },

    InLevelUpMode: function () {
        try {
            if (!gm.getItem('EnableLevelUpMode', true, hiddenVar)) {
                //if levelup mode is false then new level up mode is also false (kob)
                state.setItem("newLevelUpMode", false);
                return false;
            }

            if (!(this.stats.indicators.enl) || (this.stats.indicators.enl).toString().match(new Date(2009, 1, 1).getTime())) {
                //if levelup mode is false then new level up mode is also false (kob)
                state.setItem("newLevelUpMode", false);
                return false;
            }

            // minutesBeforeLevelToUseUpStaEnergy : 5, = 30000
            if (((this.stats.indicators.enl - new Date().getTime()) < 30000) || (this.stats.exp.dif <= config.getItem('LevelUpGeneralExp', 0))) {
                //detect if we are entering level up mode for the very first time (kob)
                if (!state.getItem("newLevelUpMode", false)) {
                    //set the current level up mode flag so that we don't call refresh monster routine more than once (kob)
                    state.setItem("newLevelUpMode", true);
                    this.refreshMonstersListener();
                }

                return true;
            }

            //if levelup mode is false then new level up mode is also false (kob)
            state.setItem("newLevelUpMode", false);
            return false;
        } catch (err) {
            utility.error("ERROR in InLevelUpMode: " + err);
            return false;
        }
    },

    CheckStamina: function (battleOrMonster, attackMinStamina) {
        try {
            utility.log(5, "CheckStamina", battleOrMonster, attackMinStamina);
            if (!attackMinStamina) {
                attackMinStamina = 1;
            }

            var when           = config.getItem('When' + battleOrMonster, 'Never'),
                maxIdleStamina = 0,
                theGeneral     = '',
                staminaMF      = '';

            if (when === 'Never') {
                return false;
            }

            if (!this.stats.stamina || !this.stats.health) {
                this.SetDivContent('battle_mess', 'Health or stamina not known yet.');
                return false;
            }

            if (this.stats.health.num < 10) {
                this.SetDivContent('battle_mess', "Need health to fight: " + this.stats.health.num + "/10");
                return false;
            }

            if (battleOrMonster === "Battle" && config.getItem("waitSafeHealth", false) && this.stats.health.num < 13) {
                this.SetDivContent('battle_mess', "Unsafe. Need spare health to fight: " + this.stats.health.num + "/13");
                return false;
            }

            if (when === 'At X Stamina') {
                if (this.InLevelUpMode() && this.stats.stamina.num >= attackMinStamina) {
                    this.SetDivContent('battle_mess', 'Burning stamina to level up');
                    return true;
                }

                staminaMF = battleOrMonster + 'Stamina';
                if (state.getItem('BurnMode_' + staminaMF, false) || this.stats.stamina.num >= config.getItem('X' + staminaMF, 1)) {
                    if (this.stats.stamina.num < attackMinStamina || this.stats.stamina.num <= config.getItem('XMin' + staminaMF, 0)) {
                        state.setItem('BurnMode_' + staminaMF, false);
                        return false;
                    }

                    state.setItem('BurnMode_' + staminaMF, true);
                    return true;
                } else {
                    state.setItem('BurnMode_' + staminaMF, false);
                }

                this.SetDivContent('battle_mess', 'Waiting for stamina: ' + this.stats.stamina.num + "/" + config.getItem('X' + staminaMF, 1));
                return false;
            }

            if (when === 'At Max Stamina') {
                maxIdleStamina = this.stats.stamina.max;
                theGeneral = config.getItem('IdleGeneral', 'Use Current');
                if (theGeneral !== 'Use Current') {
                    maxIdleStamina = general.GetStaminaMax(theGeneral);
                }

                if (theGeneral !== 'Use Current' && !maxIdleStamina) {
                    utility.log(2, "Changing to idle general to get Max Stamina");
                    if (general.Select('IdleGeneral')) {
                        return true;
                    }
                }

                if (this.stats.stamina.num >= maxIdleStamina) {
                    this.SetDivContent('battle_mess', 'Using max stamina');
                    return true;
                }

                if (this.InLevelUpMode() && this.stats.stamina.num >= attackMinStamina) {
                    this.SetDivContent('battle_mess', 'Burning all stamina to level up');
                    return true;
                }

                this.SetDivContent('battle_mess', 'Waiting for max stamina: ' + this.stats.stamina.num + "/" + maxIdleStamina);
                return false;
            }

            if (this.stats.stamina.num >= attackMinStamina) {
                return true;
            }

            this.SetDivContent('battle_mess', 'Waiting for more stamina: ' + this.stats.stamina.num + "/" + attackMinStamina);
            return false;
        } catch (err) {
            utility.error("ERROR in CheckStamina: " + err);
            return false;
        }
    },

    /*-------------------------------------------------------------------------------------\
    NeedToHide will return true if the current stamina and health indicate we need to bring
    our health down through battles (hiding).  It also returns true if there is no other outlet
    for our stamina (currently this just means Monsters, but will eventually incorporate
    other stamina uses).
    \-------------------------------------------------------------------------------------*/
    NeedToHide: function () {
        try {
            if (config.getItem('WhenMonster', 'Never') === 'Never') {
                utility.log(1, 'Stay Hidden Mode: Monster battle not enabled');
                return true;
            }

            if (!state.getItem('targetFrombattle_monster', '')) {
                utility.log(1, 'Stay Hidden Mode: No monster to battle');
                return true;
            }
        /*-------------------------------------------------------------------------------------\
        The riskConstant helps us determine how much we stay in hiding and how much we are willing
        to risk coming out of hiding.  The lower the riskConstant, the more we spend stamina to
        stay in hiding. The higher the risk constant, the more we attempt to use our stamina for
        non-hiding activities.  The below matrix shows the default riskConstant of 1.7

                    S   T   A   M   I   N   A
                    1   2   3   4   5   6   7   8   9        -  Indicates we use stamina to hide
            H   10  -   -   +   +   +   +   +   +   +        +  Indicates we use stamina as requested
            E   11  -   -   +   +   +   +   +   +   +
            A   12  -   -   +   +   +   +   +   +   +
            L   13  -   -   +   +   +   +   +   +   +
            T   14  -   -   -   +   +   +   +   +   +
            H   15  -   -   -   +   +   +   +   +   +
                16  -   -   -   -   +   +   +   +   +
                17  -   -   -   -   -   +   +   +   +
                18  -   -   -   -   -   +   +   +   +

        Setting our riskConstant down to 1 will result in us spending out stamina to hide much
        more often:

                    S   T   A   M   I   N   A
                    1   2   3   4   5   6   7   8   9        -  Indicates we use stamina to hide
            H   10  -   -   +   +   +   +   +   +   +        +  Indicates we use stamina as requested
            E   11  -   -   +   +   +   +   +   +   +
            A   12  -   -   -   +   +   +   +   +   +
            L   13  -   -   -   -   +   +   +   +   +
            T   14  -   -   -   -   -   +   +   +   +
            H   15  -   -   -   -   -   -   +   +   +
                16  -   -   -   -   -   -   -   +   +
                17  -   -   -   -   -   -   -   -   +
                18  -   -   -   -   -   -   -   -   -

        \-------------------------------------------------------------------------------------*/
            var riskConstant = gm.getItem('HidingRiskConstant', 1.7, hiddenVar);
        /*-------------------------------------------------------------------------------------\
        The formula for determining if we should hide goes something like this:

            If  (health - (estimated dmg from next attacks) puts us below 10)  AND
                (current stamina will be at least 5 using staminatime/healthtime ratio)
            Then stamina can be used/saved for normal process
            Else stamina is used for us to hide

        \-------------------------------------------------------------------------------------*/
            //if ((this.stats.health.num - ((this.stats.stamina.num - 1) * riskConstant) < 10) && (this.stats.stamina.num * (5 / 3) >= 5)) {
            if ((this.stats.health.num - ((this.stats.stamina.num - 1) * riskConstant) < 10) && ((this.stats.stamina.num + gm.getItem('HideStaminaRisk', 1, hiddenVar)) >= state.getItem('MonsterStaminaReq', 1))) {
                return false;
            } else {
                return true;
            }
        } catch (err) {
            utility.error("ERROR in NeedToHide: " + err);
            return undefined;
        }
    },

    /////////////////////////////////////////////////////////////////////
    //                          POTIONS
    /////////////////////////////////////////////////////////////////////

    ConsumePotion: function (potion) {
        try {
            if (!$(".statsTTitle").length) {
                utility.log(2, "Going to keep for potions");
                if (utility.NavigateTo('keep')) {
                    return true;
                }
            }

            var formId    = "app46755028429_consume_1",
                potionDiv = null,
                button    = null;

            if (potion === 'stamina') {
                formId = "app46755028429_consume_2";
            }

            utility.log(1, "Consuming potion", potion);
            potionDiv = $("form[id='" + formId + "'] input[src*='potion_consume.gif']");
            if (potionDiv && potionDiv.length) {
                button = potionDiv.get(0);
                if (button) {
                    utility.Click(button);
                } else {
                    utility.warn("Could not find consume button for", potion);
                    return false;
                }
            } else {
                utility.warn("Could not find consume form for", potion);
                return false;
            }

            return true;
        } catch (err) {
            utility.error("ERROR in ConsumePotion: " + err, potion);
            return false;
        }
    },

    AutoPotions: function () {
        try {
            if (!config.getItem('AutoPotions', true) || !schedule.check('AutoPotionTimerDelay')) {
                return false;
            }

            if (this.stats.exp.dif <= config.getItem("potionsExperience", 20)) {
                utility.log(2, "AutoPotions, ENL condition. Delaying 10 minutes");
                schedule.setItem('AutoPotionTimerDelay', 600);
                return false;
            }

            if (this.stats.energy.num < this.stats.energy.max - 10 &&
                this.stats.potions.energy >= config.getItem("energyPotionsSpendOver", 39) &&
                this.stats.potions.energy > config.getItem("energyPotionsKeepUnder", 35)) {
                return this.ConsumePotion('energy');
            }

            if (this.stats.stamina.num < this.stats.stamina.max - 10 &&
                this.stats.potions.stamina >= config.getItem("staminaPotionsSpendOver", 39) &&
                this.stats.potions.stamina > config.getItem("staminaPotionsKeepUnder", 35)) {
                return this.ConsumePotion('stamina');
            }

            return false;
        } catch (err) {
            utility.error("ERROR in AutoPotion: " + err);
            return false;
        }
    },

    /*-------------------------------------------------------------------------------------\
    AutoAlchemy perform aclchemy combines for all recipes that do not have missing
    ingredients.  By default, it also will not combine Battle Hearts.
    First we make sure the option is set and that we haven't been here for a while.
    \-------------------------------------------------------------------------------------*/
    AutoAlchemy: function () {
        try {
            if (!config.getItem('AutoAlchemy', false)) {
                return false;
            }

            if (!schedule.check('AlchemyTimer')) {
                return false;
            }
    /*-------------------------------------------------------------------------------------\
    Now we navigate to the Alchemy Recipe page.
    \-------------------------------------------------------------------------------------*/
            if (!utility.NavigateTo('keep,alchemy', 'tab_alchemy_on.gif')) {
                var button    = null,
                    recipeDiv = null,
                    tempDiv   = null;

                recipeDiv = $("#app46755028429_recipe_list");
                if (recipeDiv && recipeDiv.length) {
                    if (recipeDiv.attr("class") !== 'show_items') {
                        tempDiv = recipeDiv.find("div[id*='alchemy_item_tab']");
                        if (tempDiv && tempDiv.length) {
                            button = tempDiv.get(0);
                            if (button) {
                                utility.Click(button);
                                return true;
                            } else {
                                utility.warn('Cant find tab button', button);
                                return false;
                            }
                        } else {
                            utility.warn('Cant find item tab', tempDiv);
                            return false;
                        }
                    }
                } else {
                    utility.warn('Cant find recipe list', recipeDiv);
                    return false;
                }
    /*-------------------------------------------------------------------------------------\
    We close the results of our combines so they don't hog up our screen
    \-------------------------------------------------------------------------------------*/
                button = utility.CheckForImage('help_close_x.gif');
                if (button) {
                    utility.Click(button);
                    return true;
                }
    /*-------------------------------------------------------------------------------------\
    Now we get all of the recipes and step through them one by one
    \-------------------------------------------------------------------------------------*/
                var ss = document.evaluate(".//div[@class='alchemyRecipeBack']", document.body, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                for (var s = 0, len = ss.snapshotLength; s < len; s += 1) {
                    recipeDiv = ss.snapshotItem(s);
    /*-------------------------------------------------------------------------------------\
    If we are missing an ingredient then skip it
    \-------------------------------------------------------------------------------------*/
                    if (nHtml.FindByAttrContains(recipeDiv, 'div', 'class', 'missing')) {
                        utility.log(4, 'Skipping Recipe');
                        continue;
                    }
    /*-------------------------------------------------------------------------------------\
    If we are skipping battle hearts then skip it
    \-------------------------------------------------------------------------------------*/
                    if (utility.CheckForImage('raid_hearts', recipeDiv) && !config.getItem('AutoAlchemyHearts', false)) {
                        utility.log(2, 'Skipping Hearts');
                        continue;
                    }
    /*-------------------------------------------------------------------------------------\
    Find our button and click it
    \-------------------------------------------------------------------------------------*/
                    button = nHtml.FindByAttrXPath(recipeDiv, 'input', "@type='image'");
                    if (button) {
                        utility.Click(button);
                        return true;
                    } else {
                        utility.warn('Cant Find Item Image Button');
                    }
                }
    /*-------------------------------------------------------------------------------------\
    All done. Set the timer to check back in 3 hours.
    \-------------------------------------------------------------------------------------*/
                schedule.setItem('AlchemyTimer', 10800, 300);
                return false;
            }

            return true;
        } catch (err) {
            utility.error("ERROR in Alchemy: " + err);
            return false;
        }
    },

    /////////////////////////////////////////////////////////////////////
    //                          BANKING
    // Keep it safe!
    /////////////////////////////////////////////////////////////////////

    ImmediateBanking: function () {
        if (!config.getItem("BankImmed", false)) {
            return false;
        }

        return this.Bank();
    },

    Bank: function () {
        try {
            if (config.getItem("NoBankAfterLvl", true) && state.getItem('KeepLevelUpGeneral', false)) {
                return false;
            }

            var maxInCash     = -1,
                minInCash     = 0,
                depositButton = null,
                numberInput   = null,
                deposit       = 0;

            maxInCash = config.getItem('MaxInCash', -1);
            minInCash = config.getItem('MinInCash', 0);
            if (!maxInCash || maxInCash < 0 || this.stats.gold.cash <= minInCash || this.stats.gold.cash < maxInCash || this.stats.gold.cash < 10) {
                return false;
            }

            if (general.Select('BankingGeneral')) {
                return true;
            }

            depositButton = $("input[src*='btn_stash.gif']");
            if (!depositButton || !depositButton.length) {
                // Cannot find the link
                return utility.NavigateTo('keep');
            }

            numberInput = $("input[name='stash_gold']");
            if (!numberInput || !numberInput.length) {
                utility.warn('Cannot find box to put in number for bank deposit.');
                return false;
            }

            deposit = parseInt(numberInput.attr("value"), 10) - minInCash;
            numberInput.attr("value", deposit);
            utility.log(1, 'Depositing into bank:', deposit);
            utility.Click(depositButton.get(0));
            return true;
        } catch (err) {
            utility.error("ERROR in Bank: " + err);
            return false;
        }
    },

    RetrieveFromBank: function (num) {
        try {
            if (num <= 0) {
                return false;
            }

            var retrieveButton = null,
                numberInput    = null,
                minInStore     = 0;

            retrieveButton = $("input[src*='btn_retrieve.gif']");
            if (!retrieveButton || !retrieveButton.length) {
                // Cannot find the link
                return utility.NavigateTo('keep');
            }

            minInStore = config.getItem('minInStore', 0);
            if (!(minInStore || minInStore <= this.stats.gold.bank - num)) {
                return false;
            }

            numberInput = $("input[name='get_gold']");
            if (!numberInput || !numberInput.length) {
                utility.warn('Cannot find box to put in number for bank retrieve.');
                return false;
            }

            numberInput.attr("value", num);
            utility.log(1, 'Retrieving from bank:', num);
            state.setItem('storeRetrieve', '');
            utility.Click(retrieveButton.get(0));
            return true;
        } catch (err) {
            utility.error("ERROR in RetrieveFromBank: " + err);
            return false;
        }
    },

    /////////////////////////////////////////////////////////////////////
    //                          HEAL
    /////////////////////////////////////////////////////////////////////

    Heal: function () {
        try {
            var minToHeal     = 0,
                minStamToHeal = 0;

            this.SetDivContent('heal_mess', '');
            minToHeal = config.getItem('MinToHeal', 0);
            if (minToHeal === "" || minToHeal < 0 || !utility.isNum(minToHeal)) {
                return false;
            }

            minStamToHeal = config.getItem('MinStamToHeal', 0);
            if (minStamToHeal === "" || minStamToHeal < 0 || !utility.isNum(minStamToHeal)) {
                minStamToHeal = 0;
            }

            if (!this.stats.health || $.isEmptyObject(this.stats.health) || $.isEmptyObject(this.stats.healthT)) {
                return false;
            }

            if (!this.stats.stamina || $.isEmptyObject(this.stats.stamina) || $.isEmptyObject(this.stats.staminaT)) {
                return false;
            }

            if ((config.getItem('WhenBattle', 'Never') !== 'Never') || (config.getItem('WhenMonster', 'Never') !== 'Never')) {
                if ((this.InLevelUpMode() || this.stats.stamina.num >= this.stats.staminaT.max) && this.stats.health.num < 10) {
                    utility.log(1, 'Heal');
                    return utility.NavigateTo('keep,heal_button.gif');
                }
            }

            if (this.stats.health.num >= this.stats.healthT.max || this.stats.health.num >= minToHeal) {
                return false;
            }

            if (this.stats.stamina.num < minStamToHeal) {
                this.SetDivContent('heal_mess', 'Waiting for stamina to heal: ' + this.stats.stamina.num + '/' + minStamToHeal);
                return false;
            }

            utility.log(1, 'Heal');
            return utility.NavigateTo('keep,heal_button.gif');
        } catch (err) {
            utility.error("ERROR in Heal: " + err);
            return false;
        }
    },

    /////////////////////////////////////////////////////////////////////
    //                          ELITE GUARD
    /////////////////////////////////////////////////////////////////////

    AutoElite: function () {
        try {
            if (!config.getItem('AutoElite', false)) {
                return false;
            }

            if (!schedule.check('AutoEliteGetList')) {
                if (!state.getItem('FillArmy', false) && state.getItem(this.friendListType.giftc.name + 'Requested', false)) {
                    state.setItem(this.friendListType.giftc.name + 'Requested', false);
                }

                return false;
            }

            utility.log(2, 'Elite Guard cycle');
            var MergeMyEliteTodo = function (list) {
                utility.log(3, 'Elite Guard MergeMyEliteTodo list');
                var eliteArmyList = utility.TextToArray(config.getItem('EliteArmyList', ''));
                if (eliteArmyList.length) {
                    utility.log(3, 'Merge and save Elite Guard MyEliteTodo list');
                    var diffList = list.filter(function (todoID) {
                        return (eliteArmyList.indexOf(todoID) < 0);
                    });

                    $.merge(eliteArmyList, diffList);
                    state.setItem('MyEliteTodo', eliteArmyList);
                } else {
                    utility.log(3, 'Save Elite Guard MyEliteTodo list');
                    state.setItem('MyEliteTodo', list);
                }
            };

            var eliteList = state.getItem('MyEliteTodo', []);
            if (!$.isArray(eliteList)) {
                utility.warn('MyEliteTodo list is not expected format, deleting', eliteList);
                eliteList = state.setItem('MyEliteTodo', []);
            }

            if (window.location.href.indexOf('party.php')) {
                utility.log(1, 'Checking Elite Guard status');
                var autoEliteFew = state.getItem('AutoEliteFew', false);
                var autoEliteFull = $('.result_body').text().match(/YOUR Elite Guard is FULL/i);
                if (autoEliteFull || (autoEliteFew && state.getItem('AutoEliteEnd', '') === 'NoArmy')) {
                    if (autoEliteFull) {
                        utility.log(1, 'Elite Guard is FULL');
                        if (eliteList.length) {
                            MergeMyEliteTodo(eliteList);
                        }
                    } else if (autoEliteFew && state.getItem('AutoEliteEnd', '') === 'NoArmy') {
                        utility.log(1, 'Not enough friends to fill Elite Guard');
                        state.setItem('AutoEliteFew', false);
                    }

                    utility.log(3, 'Set Elite Guard AutoEliteGetList timer');
                    schedule.setItem('AutoEliteGetList', 21600, 300);
                    state.setItem('AutoEliteEnd', 'Full');
                    utility.log(1, 'Elite Guard done');
                    return false;
                }
            }

            if (!eliteList.length) {
                utility.log(2, 'Elite Guard no MyEliteTodo cycle');
                var allowPass = false;
                if (state.getItem(this.friendListType.giftc.name + 'Requested', false) && state.getItem(this.friendListType.giftc.name + 'Responded', false) === true) {
                    utility.log(2, 'Elite Guard received 0 friend ids');
                    if (utility.TextToArray(config.getItem('EliteArmyList', '')).length) {
                        utility.log(2, 'Elite Guard has some defined friend ids');
                        allowPass = true;
                    } else {
                        schedule.setItem('AutoEliteGetList', 21600, 300);
                        utility.log(2, 'Elite Guard has 0 defined friend ids');
                        state.setItem('AutoEliteEnd', 'Full');
                        utility.log(1, 'Elite Guard done');
                        return false;
                    }
                }

                this.GetFriendList(this.friendListType.giftc);
                var castleageList = [];
                if (state.getItem(this.friendListType.giftc.name + 'Responded', false) !== true) {
                    castleageList = state.getItem(this.friendListType.giftc.name + 'Responded', []);
                }

                if (castleageList.length || (this.stats.army.capped <= 1) || allowPass) {
                    utility.log(2, 'Elite Guard received a new friend list');
                    MergeMyEliteTodo(castleageList);
                    state.setItem(this.friendListType.giftc.name + 'Responded', []);
                    state.setItem(this.friendListType.giftc.name + 'Requested', false);
                    eliteList = state.getItem('MyEliteTodo', []);
                    if (eliteList.length === 0) {
                        utility.log(1, 'WARNING! Elite Guard friend list is 0');
                        state.setItem('AutoEliteFew', true);
                        schedule.setItem('AutoEliteGetList', 21600, 300);
                    } else if (eliteList.length < 50) {
                        utility.log(1, 'WARNING! Elite Guard friend list is fewer than 50: ', eliteList.length);
                        state.setItem('AutoEliteFew', true);
                    }
                }
            } else if (schedule.check('AutoEliteReqNext')) {
                utility.log(2, 'Elite Guard has a MyEliteTodo list, shifting User ID');
                var user = eliteList.shift();
                utility.log(1, 'Add Elite Guard ID: ', user);
                utility.ClickAjaxLinkSend('party.php?twt=jneg&jneg=true&user=' + user);
                utility.log(2, 'Elite Guard sent request, saving shifted MyEliteTodo');
                state.setItem('MyEliteTodo', eliteList);
                schedule.setItem('AutoEliteReqNext', 7);
                if (!eliteList.length) {
                    utility.log(2, 'Army list exhausted');
                    state.setItem('AutoEliteEnd', 'NoArmy');
                }
            }

            utility.log(1, 'Release Elite Guard cycle');
            return true;
        } catch (err) {
            utility.error("ERROR in AutoElite: " + err);
            return false;
        }
    },

    /////////////////////////////////////////////////////////////////////
    //                          PASSIVE GENERALS
    /////////////////////////////////////////////////////////////////////

    PassiveGeneral: function () {
        if (config.getItem('IdleGeneral', 'Use Current') !== 'Use Current') {
            if (general.Select('IdleGeneral')) {
                return true;
            }
        }

        return false;
    },

    /////////////////////////////////////////////////////////////////////
    //                          AUTOINCOME
    /////////////////////////////////////////////////////////////////////

    AutoIncome: function () {
        if (config.getItem("NoIncomeAfterLvl", true) && state.getItem('KeepLevelUpGeneral', false)) {
            return false;
        }

        if (this.stats.gold.payTime.minutes < 1 && this.stats.gold.payTime.ticker.match(/[0-9]+:[0-9]+/) && config.getItem('IncomeGeneral', 'Use Current') !== 'Use Current') {
            general.Select('IncomeGeneral');
            return true;
        }

        return false;
    },

    /////////////////////////////////////////////////////////////////////
    //                              AUTOGIFT
    /////////////////////////////////////////////////////////////////////

    CheckResults_army: function (resultsText) {
        var listHref = null,
            link     = '',
            autoGift = false;

        autoGift = config.getItem('AutoGift', false);
        listHref = $("#app46755028429_app_body div[class='messages'] a[href*='army.php?act=ignore']");
        if (listHref && listHref.length) {
            if (autoGift) {
                utility.log(1, 'We have a gift waiting!');
                state.setItem('HaveGift', true);
            }

            listHref.each(function () {
                link = "<br /><a title='This link can be used to collect the " +
                    "gift when it has been lost on Facebook. !!If you accept a gift " +
                    "in this manner then it will leave an orphan request on Facebook!!' " +
                    "href='" + $(this).attr("href").replace('ignore', 'acpt') + "'>Lost Accept</a>";
                $(link).insertAfter($(this));
            });
        } else {
            if (autoGift) {
                utility.log(2, 'No gifts waiting.');
                state.setItem('HaveGift', false);
            }
        }

        if (autoGift) {
            schedule.setItem("ajaxGiftCheck", gm.getItem('CheckGiftMins', 15, hiddenVar) * 60, 300);
        }
    },

    SortObject: function (obj, sortfunc, deep) {
        var list   = [],
            output = {},
            i      = 0,
            len    = 0;

        if (typeof deep === 'undefined') {
            deep = false;
        }

        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                list.push(i);
            }
        }

        list.sort(sortfunc);
        for (i = 0, len = list.length; i < len; i += 1) {
            if (deep && $.isPlainObject(obj[list[i]])) {
                output[list[i]] = this.SortObject(obj[list[i]], sortfunc, deep);
            } else {
                output[list[i]] = obj[list[i]];
            }
        }

        return output;
    },

    News: function () {
        try {
            if ($('#app46755028429_battleUpdateBox').length) {
                var xp = 0,
                    bp = 0,
                    wp = 0,
                    win = 0,
                    lose = 0,
                    deaths = 0,
                    cash = 0,
                    i,
                    list = [],
                    user = {};

                $('#app46755028429_battleUpdateBox .alertsContainer .alert_content').each(function (i, el) {
                    var uid,
                        txt = $(el).text().replace(/,/g, ''),
                        title = $(el).prev().text(),
                        days = title.regex(/([0-9]+) days/i),
                        hours = title.regex(/([0-9]+) hours/i),
                        minutes = title.regex(/([0-9]+) minutes/i),
                        seconds = title.regex(/([0-9]+) seconds/i),
                        time,
                        my_xp = 0,
                        my_bp = 0,
                        my_wp = 0,
                        my_cash = 0;

                    time = Date.now() - ((((((((days || 0) * 24) + (hours || 0)) * 60) + (minutes || 59)) * 60) + (seconds || 59)) * 1000);
                    if (txt.regex(/You were killed/i)) {
                        deaths += 1;
                    } else {
                        uid = $('a:eq(0)', el).attr('href').regex(/user=([0-9]+)/i);
                        user[uid] = user[uid] ||
                            {
                                name: $('a:eq(0)', el).text(),
                                win: 0,
                                lose: 0
                            };

                        var result = null;
                        if (txt.regex(/Victory!/i)) {
                            win += 1;
                            user[uid].lose += 1;
                            my_xp = txt.regex(/([0-9]+) experience/i);
                            my_bp = txt.regex(/([0-9]+) Battle Points!/i);
                            my_wp = txt.regex(/([0-9]+) War Points!/i);
                            my_cash = txt.regex(/\$([0-9]+)/i);
                            result = 'win';
                        } else {
                            lose += 1;
                            user[uid].win += 1;
                            my_xp = 0 - txt.regex(/([0-9]+) experience/i);
                            my_bp = 0 - txt.regex(/([0-9]+) Battle Points!/i);
                            my_wp = 0 - txt.regex(/([0-9]+) War Points!/i);
                            my_cash = 0 - txt.regex(/\$([0-9]+)/i);
                            result = 'loss';
                        }

                        xp += my_xp;
                        bp += my_bp;
                        wp += my_wp;
                        cash += my_cash;

                    }
                });

                if (win || lose) {
                    list.push('You were challenged <strong>' + (win + lose) + '</strong> times,<br>winning <strong>' + win + '</strong> and losing <strong>' + lose + '</strong>.');
                    list.push('You ' + (xp >= 0 ? 'gained <span class="positive">' : 'lost <span class="negative">') + this.makeCommaValue(Math.abs(xp)) + '</span> experience points.');
                    list.push('You ' + (cash >= 0 ? 'gained <span class="positive">' : 'lost <span class="negative">') + '<b class="gold">$' + this.makeCommaValue(Math.abs(cash)) + '</b></span>.');
                    list.push('You ' + (bp >= 0 ? 'gained <span class="positive">' : 'lost <span class="negative">') + this.makeCommaValue(Math.abs(bp)) + '</span> Battle Points.');
                    list.push('You ' + (wp >= 0 ? 'gained <span class="positive">' : 'lost <span class="negative">') + this.makeCommaValue(Math.abs(wp)) + '</span> War Points.');
                    list.push('');
                    user = this.SortObject(user, function (a, b) {
                            return (user[b].win + (user[b].lose / 100)) - (user[a].win + (user[a].lose / 100));
                        });

                    for (i in user) {
                        if (user.hasOwnProperty(i)) {
                            list.push('<strong title="' + i + '">' + user[i].name + '</strong> ' +
                                (user[i].win ? 'beat you <span class="negative">' + user[i].win +
                                '</span> time' + (user[i].win > 1 ? 's' : '') : '') +
                                (user[i].lose ? (user[i].win ? ' and ' : '') +
                                'was beaten <span class="positive">' + user[i].lose +
                                '</span> time' + (user[i].lose > 1 ? 's' : '') : '') + '.');
                        }
                    }

                    if (deaths) {
                        list.push('You died ' + (deaths > 1 ? deaths + ' times' : 'once') + '!');
                    }

                    $('#app46755028429_battleUpdateBox .alertsContainer').prepend('<div style="padding: 0pt 0pt 10px;"><div class="alert_title">Summary:</div><div class="alert_content">' + list.join('<br>') + '</div></div>');
                }
            }

            return true;
        } catch (err) {
            utility.error("ERROR in News: " + err);
            return false;
        }
    },

    CheckResults_index: function (resultsText) {
        if (config.getItem('NewsSummary', true)) {
            this.News();
        }

        // Check for new gifts
        // A warrior wants to join your Army!
        // Send Gifts to Friends
        if (config.getItem('AutoGift', false)) {
            if (resultsText && /Send Gifts to Friends/.test(resultsText)) {
                utility.log(1, 'We have a gift waiting!');
                state.setItem('HaveGift', true);
            } else {
                utility.log(2, 'No gifts waiting.');
                state.setItem('HaveGift', false);
            }

            schedule.setItem("ajaxGiftCheck", gm.getItem('CheckGiftMins', 15, hiddenVar) * 60, 300);
        }
    },

    CheckResults_gift_accept: function (resultsText) {
        // Confirm gifts actually sent
        gifting.queue.sent();
        gifting.collected();
    },

    GiftExceedLog: true,

    AutoGift: function () {
        try {
            var tempDiv    = null,
                tempText   = '',
                giftImg    = '',
                giftChoice = '',
                popCheck,
                collecting;

            if (!config.getItem('AutoGift', false)) {
                return false;
            }

            popCheck = gifting.popCheck();
            if (typeof popCheck === 'boolean') {
                return popCheck;
            }

            // Go to gifts page if gift list is empty
            if (gifting.gifts.length() <= 2) {
                if (utility.NavigateTo('army,gift', 'tab_gifts_on.gif')) {
                    return true;
                }
            }

            collecting = gifting.collecting();
            if (typeof collecting === 'boolean') {
                return collecting;
            }

            if (config.getItem("CollectOnly", false)) {
                return false;
            }

            if (!schedule.check("NoGiftDelay")) {
                return false;
            }

            if (!schedule.check("MaxGiftsExceeded")) {
                if (this.GiftExceedLog) {
                    utility.log(1, 'Gifting limit exceeded, will try later');
                    this.GiftExceedLog = false;
                }

                return false;
            }

            giftChoice = gifting.queue.chooseGift();
            if (gifting.queue.length() && giftChoice) {
                //if (utility.NavigateTo('army,gift,gift_invite_castle_off.gif', 'gift_invite_castle_on.gif')) {
                if (utility.NavigateTo('army,gift', 'tab_gifts_on.gif')) {
                    return true;
                }

                giftImg = gifting.gifts.getImg(giftChoice);
                if (giftImg) {
                    utility.NavigateTo('gift_more_gifts.gif');
                    tempDiv = $("#app46755028429_giftContainer img[class='imgButton']").eq(0);
                    if (tempDiv && tempDiv.length) {
                        tempText = utility.getHTMLPredicate(tempDiv.attr("src"));
                        if (tempText !== giftImg) {
                            utility.log(3, "images", tempText, giftImg);
                            return utility.NavigateTo(giftImg);
                        }

                        utility.log(1, "Gift selected", giftChoice);
                    }
                } else {
                    utility.log(1, "Unknown gift, using first", giftChoice);
                }

                if (gifting.queue.chooseFriend(gm.getItem("NumberOfGifts", 5, hiddenVar))) {
                    tempDiv = $("form[id*='req_form_'] input[name='send']");
                    if (tempDiv && tempDiv.length) {
                        utility.Click(tempDiv.get(0));
                        return true;
                    } else {
                        utility.warn("Send button not found!");
                        return false;
                    }
                } else {
                    utility.log(1, "No friends chosen");
                    return false;
                }
            }

            if ($.isEmptyObject(gifting.getCurrent())) {
                return false;
            }

            return true;
        } catch (err) {
            utility.error("ERROR in AutoGift: " + err);
            return false;
        }
    },

    /////////////////////////////////////////////////////////////////////
    //                              IMMEDIATEAUTOSTAT
    /////////////////////////////////////////////////////////////////////

    ImmediateAutoStat: function () {
        if (!config.getItem("StatImmed", false) || !config.getItem('AutoStat', false)) {
            return false;
        }

        return caap.AutoStat();
    },

    ////////////////////////////////////////////////////////////////////
    //                      Auto Stat
    ////////////////////////////////////////////////////////////////////

    IncreaseStat: function (attribute, attrAdjust, atributeSlice) {
        try {
            utility.log(9, "Attribute: " + attribute + "   Adjust: " + attrAdjust);
            attribute = attribute.toLowerCase();
            var button        = null,
                ajaxLoadIcon  = null,
                level         = 0,
                attrCurrent   = 0,
                energy        = 0,
                stamina       = 0,
                attack        = 0,
                defense       = 0,
                health        = 0,
                attrAdjustNew = 0,
                logTxt        = "";

            ajaxLoadIcon = $('#app46755028429_AjaxLoadIcon');
            if (!ajaxLoadIcon.length || ajaxLoadIcon.css("display") !== 'none') {
                utility.warn("Unable to find AjaxLoadIcon or page not loaded: Fail");
                return "Fail";
            }

            switch (attribute) {
            case "energy" :
                button = nHtml.FindByAttrContains(atributeSlice, 'a', 'href', 'energy_max');
                break;
            case "stamina" :
                button = nHtml.FindByAttrContains(atributeSlice, 'a', 'href', 'stamina_max');
                break;
            case "attack" :
                button = nHtml.FindByAttrContains(atributeSlice, 'a', 'href', 'attack');
                break;
            case "defense" :
                button = nHtml.FindByAttrContains(atributeSlice, 'a', 'href', 'defense');
                break;
            case "health" :
                button = nHtml.FindByAttrContains(atributeSlice, 'a', 'href', 'health_max');
                break;
            default :
                throw "Unable to match attribute: " + attribute;
            }

            if (!button) {
                utility.warn("Unable to locate upgrade button: Fail ", attribute);
                return "Fail";
            }

            attrAdjustNew = attrAdjust;
            logTxt = attrAdjust;
            level = this.stats.level;
            attrCurrent = parseInt(button.parentNode.parentNode.childNodes[3].firstChild.data.replace(new RegExp("[^0-9]", "g"), ''), 10);
            energy = parseInt(nHtml.FindByAttrContains(atributeSlice, 'a', 'href', 'energy_max').parentNode.parentNode.childNodes[3].firstChild.data.replace(new RegExp("[^0-9]", "g"), ''), 10);
            stamina = parseInt(nHtml.FindByAttrContains(atributeSlice, 'a', 'href', 'stamina_max').parentNode.parentNode.childNodes[3].firstChild.data.replace(new RegExp("[^0-9]", "g"), ''), 10);
            if (level >= 10) {
                attack = parseInt(nHtml.FindByAttrContains(atributeSlice, 'a', 'href', 'attack').parentNode.parentNode.childNodes[3].firstChild.data.replace(new RegExp("[^0-9]", "g"), ''), 10);
                defense = parseInt(nHtml.FindByAttrContains(atributeSlice, 'a', 'href', 'defense').parentNode.parentNode.childNodes[3].firstChild.data.replace(new RegExp("[^0-9]", "g"), ''), 10);
                health = parseInt(nHtml.FindByAttrContains(atributeSlice, 'a', 'href', 'health_max').parentNode.parentNode.childNodes[3].firstChild.data.replace(new RegExp("[^0-9]", "g"), ''), 10);
            }

            utility.log(9, "Energy=" + energy + " Stamina=" + stamina + " Attack=" + attack + " Defense=" + defense + " Heath=" + health);
            if (config.getItem('AutoStatAdv', false)) {
                //Using eval, so user can define formulas on menu, like energy = level + 50
                attrAdjustNew = eval(attrAdjust);
                logTxt = "(" + attrAdjust + ")=" + attrAdjustNew;
            }

            if ((attribute === 'stamina') && (this.stats.points.skill < 2)) {
                if (attrAdjustNew <= attrCurrent) {
					utility.log(2, "Stamina at requirement: Next");
					return "Next";
                } else if (config.getItem("StatSpendAll", false)) {
                    utility.log(2, "Stamina requires 2 upgrade points: Next");
                    return "Next";
                } else {
                    utility.log(2, "Stamina requires 2 upgrade points: Save");
                    state.setItem("statsMatch", false);
                    return "Save";
                }
            }

            if (attrAdjustNew > attrCurrent) {
                utility.log(2, "Status Before [" + attribute + "=" + attrCurrent + "]  Adjusting To [" + logTxt + "]");
                utility.Click(button);
                return "Click";
            }

            return "Next";
        } catch (err) {
            utility.error("ERROR in IncreaseStat: " + err);
            return "Error";
        }
    },

    AutoStatCheck: function () {
        try {
            var startAtt   = 0,
                stopAtt    = 4,
                attribute  = '',
                attrValue  = 0,
                n          = 0,
                level      = 0,
                energy     = 0,
                stamina    = 0,
                attack     = 0,
                defense    = 0,
                health     = 0,
                attrAdjust = 0,
                value      = 0,
                passed     = false;

            if (!config.getItem('AutoStat', false) || !this.stats.points.skill) {
                return false;
            }

            if (config.getItem("AutoStatAdv", false)) {
                startAtt = 5;
                stopAtt = 9;
            }

            for (n = startAtt; n <= stopAtt; n += 1) {
                attribute = config.getItem('Attribute' + n, '').toLowerCase();
                if (attribute === '') {
                    continue;
                }

                if (this.stats.level < 10) {
                    if (attribute === 'attack' || attribute === 'defense' || attribute === 'health') {
                        continue;
                    }
                }

                attrValue = config.getItem('AttrValue' + n, 0);
                attrAdjust = attrValue;
                level = this.stats.level;
                energy = this.stats.energy.num;
                stamina = this.stats.stamina.num;
                if (level >= 10) {
                    attack = this.stats.attack;
                    defense = this.stats.defense;
                    health = this.stats.health.num;
                }

                if (config.getItem('AutoStatAdv', false)) {
                    //Using eval, so user can define formulas on menu, like energy = level + 50
                    attrAdjust = eval(attrValue);
                }

                if (attribute === "attack" || attribute === "defense") {
                    value = this.stats[attribute];
                } else {
                    value = this.stats[attribute].num;
                }

                if ((attribute === 'stamina') && (this.stats.points.skill < 2)) {
                    if (config.getItem("StatSpendAll", false) || attrAdjust > value) {
                        continue;
                    } else {
                        passed = false;
                        break;
                    }
                }

                if (attrAdjust > value) {
                    passed = true;
                    break;
                }
            }

            state.setItem("statsMatch", passed);
            return true;
        } catch (err) {
            utility.error("ERROR in AutoStatCheck: " + err);
            return false;
        }
    },

    AutoStat: function () {
        try {
            if (!config.getItem('AutoStat', false) || !this.stats.points.skill) {
                return false;
            }

            if (!state.getItem("statsMatch", true)) {
                if (state.getItem("autoStatRuleLog", true)) {
                    utility.log(2, "User should possibly change their stats rules");
                    state.setItem("autoStatRuleLog", false);
                }

                return false;
            }

            var atributeSlice      = null,
                startAtt           = 0,
                stopAtt            = 4,
                attrName           = '',
                attribute          = '',
                attrValue          = 0,
                n                  = 0,
                returnIncreaseStat = '';

            atributeSlice = $("div[class*='keep_attribute_section']").get(0);
            if (!atributeSlice) {
                utility.NavigateTo('keep');
                return true;
            }

            if (config.getItem("AutoStatAdv", false)) {
                startAtt = 5;
                stopAtt = 9;
            }

            for (n = startAtt; n <= stopAtt; n += 1) {
                attrName = 'Attribute' + n;
                attribute = config.getItem(attrName, '');
                if (attribute === '') {
                    utility.log(9, attrName + " is blank: continue");
                    continue;
                }

                if (this.stats.level < 10) {
                    if (attribute === 'Attack' || attribute === 'Defense' || attribute === 'Health') {
                        utility.log(1, "Characters below level 10 can not increase Attack, Defense or Health: continue");
                        continue;
                    }
                }

                attrValue = config.getItem('AttrValue' + n, 0);
                returnIncreaseStat = this.IncreaseStat(attribute, attrValue, atributeSlice);
                switch (returnIncreaseStat) {
                case "Next" :
                    utility.log(9, attrName + " : next");
                    continue;
                case "Click" :
                    utility.log(9, attrName + " : click");
                    return true;
                default :
                    utility.log(9, attrName + " return value: " + returnIncreaseStat);
                    return false;
                }
            }

            utility.log(1, "No rules match to increase stats");
            state.setItem("statsMatch", false);
            return false;
        } catch (err) {
            utility.error("ERROR in AutoStat: " + err);
            return false;
        }
    },

    AutoCollectMA: function () {
        try {
            if (!config.getItem('AutoCollectMA', false) || !schedule.check('AutoCollectMATimer') || this.stats.level < 10) {
                return false;
            }

            utility.log(2, "Collecting Master and Apprentice reward");
            caap.SetDivContent('idle_mess', 'Collect MA Reward');
            var buttonMas = utility.CheckForImage("ma_view_progress_main"),
                buttonApp = utility.CheckForImage("ma_main_learn_more");

            if (!buttonMas && !buttonApp) {
                utility.log(3, "Going to home");
                if (utility.NavigateTo('index')) {
                    return true;
                }
            }

            if (buttonMas) {
                utility.Click(buttonMas);
                this.SetDivContent('idle_mess', 'Collected MA Reward');
                utility.log(2, "Collected Master and Apprentice reward");
            }

            if (!buttonMas && buttonApp) {
                this.SetDivContent('idle_mess', 'No MA Rewards');
                utility.log(2, "No Master and Apprentice rewards");
            }

            window.setTimeout(function () {
                caap.SetDivContent('idle_mess', '');
            }, 5000);

            schedule.setItem('AutoCollectMATimer', 86400, 300);
            utility.log(2, "Collect Master and Apprentice reward completed");
            return true;
        } catch (err) {
            utility.error("ERROR in AutoCollectMA: " + err);
            return false;
        }
    },

    friendListType: {
        facebook: {
            name: "facebook",
            url: 'http://apps.facebook.com/castle_age/army.php?app_friends=false&giftSelection=1'
        },
        gifta: {
            name: "gifta",
            url: 'http://apps.facebook.com/castle_age/gift.php?app_friends=a&giftSelection=1'
        },
        giftb: {
            name: "giftb",
            url: 'http://apps.facebook.com/castle_age/gift.php?app_friends=b&giftSelection=1'
        },
        giftc: {
            name: "giftc",
            url: 'http://apps.facebook.com/castle_age/gift.php?app_friends=c&giftSelection=1'
        }
    },

    GetFriendList: function (listType, force) {
        try {
            utility.log(3, "Entered GetFriendList and request is for: ", listType.name);
            if (force) {
                state.setItem(listType.name + 'Requested', false);
                state.setItem(listType.name + 'Responded', []);
            }

            if (!state.getItem(listType.name + 'Requested', false)) {
                utility.log(3, "Getting Friend List: ", listType.name);
                state.setItem(listType.name + 'Requested', true);

                $.ajax({
                    url: listType.url,
                    error:
                        function (XMLHttpRequest, textStatus, errorThrown) {
                            state.setItem(listType.name + 'Requested', false);
                            utility.log(3, "GetFriendList(" + listType.name + "): ", textStatus);
                        },
                    success:
                        function (data, textStatus, XMLHttpRequest) {
                            try {
                                utility.log(3, "GetFriendList.ajax splitting data");
                                data = data.split('<div class="unselected_list">');
                                if (data.length < 2) {
                                    throw "Could not locate 'unselected_list'";
                                }

                                data = data[1].split('</div><div class="selected_list">');
                                if (data.length < 2) {
                                    throw "Could not locate 'selected_list'";
                                }

                                utility.log(3, "GetFriendList.ajax data split ok");
                                var friendList = [];
                                $('<div></div>').html(data[0]).find('input').each(function (index) {
                                    friendList.push($(this).val());
                                });

                                utility.log(3, "GetFriendList.ajax saving friend list of: ", friendList.length);
                                if (friendList.length) {
                                    state.setItem(listType.name + 'Responded', friendList);
                                } else {
                                    state.setItem(listType.name + 'Responded', true);
                                }

                                utility.log(3, "GetFriendList(" + listType.name + "): ", textStatus);
                            } catch (err) {
                                state.setItem(listType.name + 'Requested', false);
                                utility.error("ERROR in GetFriendList.ajax: " + err);
                            }
                        }
                });
            } else {
                utility.log(3, "Already requested GetFriendList for: ", listType.name);
            }

            return true;
        } catch (err) {
            utility.error("ERROR in GetFriendList(" + listType.name + "): " + err);
            return false;
        }
    },

    addFriendSpamCheck: 0,

    AddFriend: function (id) {
        try {
            var responseCallback = function (XMLHttpRequest, textStatus, errorThrown) {
                if (caap.addFriendSpamCheck > 0) {
                    caap.addFriendSpamCheck -= 1;
                }

                utility.log(1, "AddFriend(" + id + "): ", textStatus);
            };

            $.ajax({
                url: 'http://apps.facebook.com/castle_age/party.php?twt=jneg&jneg=true&user=' + id + '&lka=' + id + '&etw=9&ref=nf',
                error: responseCallback,
                success: responseCallback
            });

            return true;
        } catch (err) {
            utility.error("ERROR in AddFriend(" + id + "): " + err);
            return false;
        }
    },

    AutoFillArmy: function (caListType, fbListType) {
        try {
            if (!state.getItem('FillArmy', false)) {
                return false;
            }

            var armyCount = state.getItem("ArmyCount", 0);
            if (armyCount === 0) {
                this.SetDivContent('idle_mess', 'Filling Army');
                utility.log(1, "Filling army");
            }

            if (state.getItem(caListType.name + 'Responded', false) === true || state.getItem(fbListType.name + 'Responded', false) === true) {
                this.SetDivContent('idle_mess', '<span style="font-weight: bold;">Fill Army Completed</span>');
                utility.log(1, "Fill Army Completed: no friends found");
                window.setTimeout(function () {
                    caap.SetDivContent('idle_mess', '');
                }, 5000);

                state.setItem('FillArmy', false);
                state.setItem("ArmyCount", 0);
                state.setItem('FillArmyList', []);
                state.setItem(caListType.name + 'Responded', false);
                state.setItem(fbListType.name + 'Responded', false);
                state.setItem(caListType.name + 'Requested', []);
                state.setItem(fbListType.name + 'Requested', []);
                return true;
            }

            var fillArmyList = state.getItem('FillArmyList', []);
            if (!fillArmyList.length) {
                this.GetFriendList(caListType);
                this.GetFriendList(fbListType);
            }

            var castleageList = state.getItem(caListType.name + 'Responded', []);
            utility.log(3, "gifList: ", castleageList);
            var facebookList = state.getItem(fbListType.name + 'Responded', []);
            utility.log(3, "facebookList: ", facebookList);
            if ((castleageList.length && facebookList.length) || fillArmyList.length) {
                if (!fillArmyList.length) {
                    var diffList = facebookList.filter(function (facebookID) {
                        return (castleageList.indexOf(facebookID) >= 0);
                    });

                    utility.log(3, "diffList: ", diffList);
                    fillArmyList = state.setItem('FillArmyList', diffList);
                    state.setItem(caListType.name + 'Responded', false);
                    state.setItem(fbListType.name + 'Responded', false);
                    state.setItem(caListType.name + 'Requested', []);
                    state.setItem(fbListType.name + 'Requested', []);
                }

                // Add army members //
                var batchCount = 5;
                if (fillArmyList.length < 5) {
                    batchCount = fillArmyList.length;
                } else if (fillArmyList.length - armyCount < 5) {
                    batchCount = fillArmyList.length - armyCount;
                }

                batchCount = batchCount - this.addFriendSpamCheck;
                for (var i = 0; i < batchCount; i += 1) {
                    this.AddFriend(fillArmyList[armyCount]);
                    armyCount += 1;
                    this.addFriendSpamCheck += 1;
                }

                this.SetDivContent('idle_mess', 'Filling Army, Please wait...' + armyCount + "/" + fillArmyList.length);
                utility.log(1, 'Filling Army, Please wait...' + armyCount + "/" + fillArmyList.length);
                state.setItem("ArmyCount", armyCount);
                if (armyCount >= fillArmyList.length) {
                    this.SetDivContent('idle_mess', '<span style="font-weight: bold;">Fill Army Completed</span>');
                    window.setTimeout(function () {
                        caap.SetDivContent('idle_mess', '');
                    }, 5000);

                    utility.log(1, "Fill Army Completed");
                    state.setItem('FillArmy', false);
                    state.setItem("ArmyCount", 0);
                    state.setItem('FillArmyList', []);
                }
            }

            return true;
        } catch (err) {
            utility.error("ERROR in AutoFillArmy: " + err);
            this.SetDivContent('idle_mess', '<span style="font-weight: bold;">Fill Army Failed</span>');
            window.setTimeout(function () {
                caap.SetDivContent('idle_mess', '');
            }, 5000);

            state.setItem('FillArmy', false);
            state.setItem("ArmyCount", 0);
            state.setItem('FillArmyList', []);
            state.setItem(caListType.name + 'Responded', false);
            state.setItem(fbListType.name + 'Responded', false);
            state.setItem(caListType.name + 'Requested', []);
            state.setItem(fbListType.name + 'Requested', []);
            return false;
        }
    },

    AjaxGiftCheck: function () {
        try {
            if (!config.getItem('AutoGift', false) || !schedule.check("ajaxGiftCheck")) {
                return false;
            }

            utility.log(3, "Performing AjaxGiftCheck");

            $.ajax({
                url: "http://apps.facebook.com/castle_age/army.php",
                error:
                    function (XMLHttpRequest, textStatus, errorThrown) {
                        utility.error("AjaxGiftCheck.ajax", textStatus);
                    },
                success:
                    function (data, textStatus, XMLHttpRequest) {
                        try {
                            utility.log(3, "AjaxGiftCheck.ajax: Checking data.");
                            if ($(data).find("a[href*='reqs.php#confirm_46755028429_0']").length) {
                                utility.log(1, 'AjaxGiftCheck.ajax: We have a gift waiting!');
                                state.setItem('HaveGift', true);
                            } else {
                                utility.log(2, 'AjaxGiftCheck.ajax: No gifts waiting.');
                                state.setItem('HaveGift', false);
                            }

                            utility.log(3, "AjaxGiftCheck.ajax: Done.");
                        } catch (err) {
                            utility.error("ERROR in AjaxGiftCheck.ajax: " + err);
                        }
                    }
            });

            schedule.setItem("ajaxGiftCheck", gm.getItem('CheckGiftMins', 15, hiddenVar) * 60, 300);
            utility.log(3, "Completed AjaxGiftCheck");
            return true;
        } catch (err) {
            utility.error("ERROR in AjaxGiftCheck: " + err);
            return false;
        }
    },

    Idle: function () {
        if (state.getItem('resetselectMonster', false)) {
            utility.log(3, "resetselectMonster");
            monster.select(true);
            state.setItem('resetselectMonster', false);
        }

        if (this.CheckGenerals()) {
            return true;
        }

        if (general.GetAllStats()) {
            return true;
        }

        if (this.CheckKeep()) {
            return true;
        }

        if (this.CheckAchievements()) {
            return true;
        }

        if (this.AutoCollectMA()) {
            return true;
        }

        if (this.AjaxGiftCheck()) {
            return true;
        }

        if (this.ReconPlayers()) {
            return true;
        }

        if (this.CheckOracle()) {
            return true;
        }

        if (this.CheckBattleRank()) {
            return true;
        }

        if (this.CheckWarRank()) {
            return true;
        }

        if (this.CheckSymbolQuests()) {
            return true;
        }

        if (this.CheckSoldiers()) {
            return true;
        }

        if (this.CheckItem()) {
            return true;
        }

        if (this.CheckMagic()) {
            return true;
        }

        if (this.CheckCharacterClasses()) {
            return true;
        }

        this.AutoFillArmy(this.friendListType.giftc, this.friendListType.facebook);
        this.UpdateDashboard();
        state.setItem('ReleaseControl', true);
        return true;
    },

    /*-------------------------------------------------------------------------------------\
                                      RECON PLAYERS
    ReconPlayers is an idle background process that scans the battle page for viable
    targets that can later be attacked.
    \-------------------------------------------------------------------------------------*/

    ReconRecordArray : [],

    ReconRecord: function () {
        this.data = {
            userID          : 0,
            nameStr         : '',
            rankStr         : '',
            rankNum         : 0,
            warRankStr      : '',
            warRankNum      : 0,
            levelNum        : 0,
            armyNum         : 0,
            deityNum        : 0,
            invadewinsNum   : 0,
            invadelossesNum : 0,
            duelwinsNum     : 0,
            duellossesNum   : 0,
            defendwinsNum   : 0,
            defendlossesNum : 0,
            statswinsNum    : 0,
            statslossesNum  : 0,
            goldNum         : 0,
            aliveTime       : new Date(2009, 0, 1).getTime(),
            attackTime      : new Date(2009, 0, 1).getTime(),
            selectTime      : new Date(2009, 0, 1).getTime()
        };
    },

    LoadRecon: function () {
        this.ReconRecordArray = gm.getItem('recon.records', 'default');
        if (this.ReconRecordArray === 'default') {
            this.ReconRecordArray = [];
            gm.setItem('recon.records', this.ReconRecordArray);
        }

        state.setItem("ReconDashUpdate", true);
        utility.log(4, "recon.records", this.ReconRecordArray);
    },

    SaveRecon: function () {
        gm.setItem('recon.records', this.ReconRecordArray);
        state.setItem("ReconDashUpdate", true);
        utility.log(4, "recon.records", this.ReconRecordArray);
    },

    ReconPlayers: function () {
        try {
            if (!config.getItem('DoPlayerRecon', false)) {
                return false;
            }

            if (this.stats.stamina.num <= 0) {
                return false;
            }

            if (!schedule.check('PlayerReconTimer')) {
                return false;
            }

            this.SetDivContent('idle_mess', 'Player Recon: In Progress');
            utility.log(1, "Player Recon: In Progress");

            $.ajax({
                url: "http://apps.facebook.com/castle_age/battle.php",
                error:
                    function (XMLHttpRequest, textStatus, errorThrown) {
                        utility.error("ReconPlayers2.ajax", textStatus);
                    },
                success:
                    function (data, textStatus, XMLHttpRequest) {
                        try {
                            var found       = 0,
                                regex       = new RegExp('(.+)\\s*\\(Level ([0-9]+)\\)\\s*Battle: ([A-Za-z ]+) \\(Rank ([0-9]+)\\)\\s*War: ([A-Za-z ]+) \\(Rank ([0-9]+)\\)\\s*([0-9]+)', 'i'),
                                regex2      = new RegExp('(.+)\\s*\\(Level ([0-9]+)\\)\\s*Battle: ([A-Za-z ]+) \\(Rank ([0-9]+)\\)\\s*([0-9]+)', 'i'),
                                entryLimit  = gm.getItem('LimitTargets', 100, hiddenVar),
                                reconRank   = config.getItem('ReconPlayerRank', 99),
                                reconLevel  = config.getItem('ReconPlayerLevel', 999),
                                reconARBase = config.getItem('ReconPlayerARBase', 999);

                            utility.log(3, "ReconPlayers.ajax: Checking data.");

                            $(data).find("img[src*='symbol_']").not("[src*='symbol_tiny_']").each(function (index) {
                                var UserRecord      = new caap.ReconRecord(),
                                    $tempObj        = $(this).parent().parent().parent().parent().parent(),
                                    tempArray       = [],
                                    txt             = '',
                                    i               = 0,
                                    OldRecord       = null,
                                    levelMultiplier = 0,
                                    armyRatio       = 0,
                                    goodTarget      = true,
                                    len             = 0;

                                if ($tempObj.length) {
                                    tempArray = $tempObj.find("a").eq(0).attr("href").match(/user=([0-9]+)/);
                                    if (tempArray && tempArray.length === 2) {
                                        UserRecord.data.userID = parseInt(tempArray[1], 10);
                                    }

                                    for (i = 0, len = caap.ReconRecordArray.length; i < len; i += 1) {
                                        if (caap.ReconRecordArray[i].userID === UserRecord.data.userID) {
                                            UserRecord.data = caap.ReconRecordArray[i];
                                            caap.ReconRecordArray.splice(i, 1);
                                            utility.log(3, "UserRecord exists. Loaded and removed.", UserRecord);
                                            break;
                                        }
                                    }

                                    tempArray = $(this).attr("src").match(/symbol_([0-9])\.jpg/);
                                    if (tempArray && tempArray.length === 2) {
                                        UserRecord.data.deityNum = parseInt(tempArray[1], 10);
                                    }

                                    txt = $.trim($tempObj.text());
                                    if (txt.length) {
                                        if (battle.battles.Freshmeat.warLevel) {
                                            tempArray = regex.exec(txt);
                                            if (!tempArray) {
                                                tempArray = regex2.exec(txt);
                                                battle.battles.Freshmeat.warLevel = false;
                                            }
                                        } else {
                                            tempArray = regex2.exec(txt);
                                            if (!tempArray) {
                                                tempArray = regex.exec(txt);
                                                battle.battles.Freshmeat.warLevel = true;
                                            }
                                        }

                                        if (tempArray) {
                                            UserRecord.data.aliveTime      = new Date().getTime();
                                            UserRecord.data.nameStr        = $.trim(tempArray[1]);
                                            UserRecord.data.levelNum       = parseInt(tempArray[2], 10);
                                            UserRecord.data.rankStr        = tempArray[3];
                                            UserRecord.data.rankNum        = parseInt(tempArray[4], 10);
                                            if (battle.battles.Freshmeat.warLevel) {
                                                UserRecord.data.warRankStr = tempArray[5];
                                                UserRecord.data.warRankNum = parseInt(tempArray[6], 10);
                                                UserRecord.data.armyNum    = parseInt(tempArray[7], 10);
                                            } else {
                                                UserRecord.data.armyNum    = parseInt(tempArray[5], 10);
                                            }

                                            if (UserRecord.data.levelNum - caap.stats.level > reconLevel) {
                                                utility.log(3, 'Level above reconLevel max', reconLevel, UserRecord);
                                                goodTarget = false;
                                            } else if (caap.stats.rank.battle - UserRecord.data.rankNum > reconRank) {
                                                utility.log(3, 'Rank below reconRank min', reconRank, UserRecord);
                                                goodTarget = false;
                                            } else {
                                                levelMultiplier = caap.stats.level / UserRecord.data.levelNum;
                                                armyRatio = reconARBase * levelMultiplier;
                                                if (armyRatio <= 0) {
                                                    utility.log(3, 'Recon unable to calculate army ratio', reconARBase, levelMultiplier);
                                                    goodTarget = false;
                                                } else if (UserRecord.data.armyNum  > (caap.stats.army.capped * armyRatio)) {
                                                    utility.log(3, 'Army above armyRatio adjustment', armyRatio, UserRecord);
                                                    goodTarget = false;
                                                }
                                            }

                                            if (goodTarget) {
                                                while (caap.ReconRecordArray.length >= entryLimit) {
                                                    OldRecord = caap.ReconRecordArray.shift();
                                                    utility.log(3, "Entry limit matched. Deleted an old record", OldRecord);
                                                }

                                                utility.log(3, "UserRecord", UserRecord);
                                                caap.ReconRecordArray.push(UserRecord.data);
                                                found += 1;
                                            }
                                        } else {
                                            utility.warn('Recon can not parse target text string', txt);
                                        }
                                    } else {
                                        utility.warn("Can't find txt in $tempObj", $tempObj);
                                    }
                                } else {
                                    utility.warn("$tempObj is empty");
                                }
                            });

                            caap.SaveRecon();
                            caap.SetDivContent('idle_mess', 'Player Recon: Found:' + found + ' Total:' + caap.ReconRecordArray.length);
                            utility.log(1, 'Player Recon: Found:' + found + ' Total:' + caap.ReconRecordArray.length);
                            window.setTimeout(function () {
                                caap.SetDivContent('idle_mess', '');
                            }, 5 * 1000);

                            utility.log(3, "ReconPlayers.ajax: Done.", caap.ReconRecordArray);
                        } catch (err) {
                            utility.error("ERROR in ReconPlayers.ajax: " + err);
                        }
                    }
            });

            schedule.setItem('PlayerReconTimer', gm.getItem('PlayerReconRetry', 60, hiddenVar), 60);
            return true;
        } catch (err) {
            utility.error("ERROR in ReconPlayers:" + err);
            return false;
        }
    },

    /////////////////////////////////////////////////////////////////////
    //                          MAIN LOOP
    // This function repeats continously.  In principle, functions should only make one
    // click before returning back here.
    /////////////////////////////////////////////////////////////////////

    actionDescTable: {
        AutoIncome         : 'Awaiting Income',
        AutoStat           : 'Upgrade Skill Points',
        MaxEnergyQuest     : 'At Max Energy Quest',
        PassiveGeneral     : 'Setting Idle General',
        Idle               : 'Idle Tasks',
        ImmediateBanking   : 'Immediate Banking',
        Battle             : 'Battling Players',
        MonsterReview      : 'Review Monsters/Raids',
        GuildMonsterReview : 'Review Guild Monsters',
        ImmediateAutoStat  : 'Immediate Auto Stats',
        AutoElite          : 'Fill Elite Guard',
        AutoPotions        : 'Auto Potions',
        AutoAlchemy        : 'Auto Alchemy',
        AutoBless          : 'Auto Bless',
        AutoGift           : 'Auto Gifting',
        DemiPoints         : 'Demi Points First',
        Monsters           : 'Fighting Monsters',
        GuildMonster       : 'Fight Guild Monster',
        Heal               : 'Auto Healing',
        Bank               : 'Auto Banking',
        Lands              : 'Land Operations'
    },

    CheckLastAction: function (thisAction) {
        var lastAction = state.getItem('LastAction', 'none');
        if (this.actionDescTable[thisAction]) {
            this.SetDivContent('activity_mess', 'Activity: ' + this.actionDescTable[thisAction]);
        } else {
            this.SetDivContent('activity_mess', 'Activity: ' + thisAction);
        }

        if (lastAction !== thisAction) {
            utility.log(1, 'Changed from doing ' + lastAction + ' to ' + thisAction);
            state.setItem('LastAction', thisAction);
        }
    },

    // The Master Action List
    masterActionList: {
        0x00: 'AutoElite',
        0x01: 'Heal',
        0x02: 'ImmediateBanking',
        0x03: 'ImmediateAutoStat',
        0x04: 'MaxEnergyQuest',
        0x05: 'GuildMonsterReview',
        0x06: 'MonsterReview',
        0x07: 'GuildMonster',
        0x08: 'DemiPoints',
        0x09: 'Monsters',
        0x0A: 'Battle',
        0x0B: 'Quests',
        0x0C: 'Bank',
        0x0D: 'PassiveGeneral',
        0x0E: 'Lands',
        0x0F: 'AutoBless',
        0x10: 'AutoStat',
        0x11: 'AutoGift',
        0x12: 'AutoPotions',
        0x13: 'AutoAlchemy',
        0x14: 'Idle'
    },

    actionsList: [],

    MakeActionsList: function () {
        try {
            if (this.actionsList && this.actionsList.length === 0) {
                utility.log(2, "Loading a fresh Action List");
                // actionOrder is a comma seperated string of action numbers as
                // hex pairs and can be referenced in the Master Action List
                // Example: "00,01,02,03,04,05,06,07,08,09,0A,0B,0C,0D,0E,0F,10,11,12"
                var action = '';
                var actionOrderArray = [];
                var masterActionListCount = 0;
                var actionOrderUser = gm.getItem("actionOrder", '', hiddenVar);
                if (actionOrderUser !== '') {
                    // We are using the user defined actionOrder set in the
                    // Advanced Hidden Options
                    utility.log(2, "Trying user defined Action Order");
                    // We take the User Action Order and convert it from a comma
                    // separated list into an array
                    actionOrderArray = actionOrderUser.split(",");
                    // We count the number of actions contained in the
                    // Master Action list
                    for (action in this.masterActionList) {
                        if (this.masterActionList.hasOwnProperty(action)) {
                            masterActionListCount += 1;
                            utility.log(5, "Counting Action List", masterActionListCount);
                        } else {
                            utility.warn("Error Getting Master Action List length!");
                            utility.warn("Skipping 'action' from masterActionList: ", action);
                        }
                    }
                } else {
                    // We are building the Action Order Array from the
                    // Master Action List
                    utility.log(2, "Building the default Action Order");
                    for (action in this.masterActionList) {
                        if (this.masterActionList.hasOwnProperty(action)) {
                            masterActionListCount = actionOrderArray.push(action);
                            utility.log(5, "Action Added", action);
                        } else {
                            utility.warn("Error Building Default Action Order!");
                            utility.warn("Skipping 'action' from masterActionList: ", action);
                        }
                    }
                }

                // We notify if the number of actions are not sensible or the
                // same as in the Master Action List
                var actionOrderArrayCount = actionOrderArray.length;
                if (actionOrderArrayCount === 0) {
                    var throwError = "Action Order Array is empty! " + (actionOrderUser === "" ? "(Default)" : "(User)");
                    throw throwError;
                }

                if (actionOrderArrayCount < masterActionListCount) {
                    utility.warn("Warning! Action Order Array has fewer orders than default!");
                }

                if (actionOrderArrayCount > masterActionListCount) {
                    utility.warn("Warning! Action Order Array has more orders than default!");
                }

                // We build the Action List
                utility.log(8, "Building Action List ...");
                for (var itemCount = 0; itemCount !== actionOrderArrayCount; itemCount += 1) {
                    var actionItem = '';
                    if (actionOrderUser !== '') {
                        // We are using the user defined comma separated list
                        // of hex pairs
                        actionItem = this.masterActionList[parseInt(actionOrderArray[itemCount], 16)];
                        utility.log(3, "(" + itemCount + ") Converted user defined hex pair to action", actionItem);
                    } else {
                        // We are using the Master Action List
                        actionItem = this.masterActionList[actionOrderArray[itemCount]];
                        utility.log(5, "(" + itemCount + ") Converted Master Action List entry to an action", actionItem);
                    }

                    // Check the Action Item
                    if (actionItem.length > 0 && typeof(actionItem) === "string") {
                        // We add the Action Item to the Action List
                        this.actionsList.push(actionItem);
                        utility.log(5, "Added action to the list", actionItem);
                    } else {
                        utility.warn("Error! Skipping actionItem");
                        utility.warn("Action Item(" + itemCount + "): ", actionItem);
                    }
                }

                if (actionOrderUser !== '') {
                    utility.log(1, "Get Action List: ", this.actionsList);
                }
            }
            return true;
        } catch (err) {
            // Something went wrong, log it and use the emergency Action List.
            utility.error("ERROR in MakeActionsList: " + err);
            this.actionsList = [
                "AutoElite",
                "Heal",
                "ImmediateBanking",
                "ImmediateAutoStat",
                "MaxEnergyQuest",
                "MonsterReview",
                'GuildMonsterReview',
                "DemiPoints",
                "Monsters",
                "Battle",
                "Quests",
                "Bank",
                'PassiveGeneral',
                "Lands",
                "AutoBless",
                "AutoStat",
                "AutoGift",
                'AutoPotions',
                "AutoAlchemy",
                "Idle"
            ];

            return false;
        }
    },

    ErrorCheck: function () {
        // assorted errors...
        if (window.location.href.indexOf('/common/error.html') >= 0) {
            utility.log(1, 'detected error page, waiting to go back to previous page.');
            window.setTimeout(function () {
                window.history.go(-1);
            }, 30 * 1000);

            return true;
        }

        if ($('#try_again_button').length) {
            utility.log(1, 'detected Try Again message, waiting to reload');
            // error
            window.setTimeout(function () {
                window.history.go(0);
            }, 30 * 1000);

            return true;
        }

        return false;
    },

    MainLoop: function () {
        var button          = null,
            caapDisabled    = false,
            noWindowLoad    = 0,
            actionsListCopy = [],
            action          = 0,
            len             = 0,
            ajaxLoadIcon    = null;

        // assorted errors...
        if (this.ErrorCheck()) {
            return;
        }

        if (window.location.href.indexOf('apps.facebook.com/reqs.php#confirm_46755028429_0') >= 0) {
            gifting.collect();
            this.WaitMainLoop();
            return;
        }

        //We don't need to send out any notifications
        button = $("a[class*='undo_link']");
        if (button && button.length) {
            utility.Click(button.get(0));
            utility.log(1, 'Undoing notification');
        }

        caapDisabled = config.getItem('Disabled', false);
        if (caapDisabled) {
            this.WaitMainLoop();
            return;
        }

        if (!this.pageLoadOK) {
            noWindowLoad = state.getItem('NoWindowLoad', 0);
            if (noWindowLoad === 0) {
                schedule.setItem('NoWindowLoadTimer', Math.min(Math.pow(2, noWindowLoad - 1) * 15, 3600));
                state.setItem('NoWindowLoad', 1);
            } else if (schedule.check('NoWindowLoadTimer')) {
                schedule.setItem('NoWindowLoadTimer', Math.min(Math.pow(2, noWindowLoad - 1) * 15, 3600));
                state.setItem('NoWindowLoad', noWindowLoad + 1);
                this.ReloadCastleAge();
            }

            utility.log(1, 'Page no-load count: ', noWindowLoad);
            this.pageLoadOK = this.GetStats();
            this.WaitMainLoop();
            return;
        } else {
            state.setItem('NoWindowLoad', 0);
        }

        if (state.getItem('caapPause', 'none') !== 'none') {
            this.caapDivObject.css({
                background : config.getItem('StyleBackgroundDark', '#fee'),
                opacity    : config.getItem('StyleOpacityDark', 1)
            });

            this.caapTopObject.css({
                background : config.getItem('StyleBackgroundDark', '#fee'),
                opacity    : config.getItem('StyleOpacityDark', 1)
            });

            this.WaitMainLoop();
            return;
        }

        if (this.waitingForDomLoad) {
            if (schedule.since('clickedOnSomething', 45)) {
                utility.log(1, 'Clicked on something, but nothing new loaded.  Reloading page.');
                this.ReloadCastleAge();
            }

            ajaxLoadIcon = $('#app46755028429_AjaxLoadIcon');
            if (ajaxLoadIcon && ajaxLoadIcon.length && ajaxLoadIcon.css("display") !== "none") {
                utility.log(1, 'Waiting for page load ...');
                this.WaitMainLoop();
                return;
            }
        }

        if (this.AutoIncome()) {
            this.CheckLastAction('AutoIncome');
            this.WaitMainLoop();
            return;
        }

        this.MakeActionsList();
        actionsListCopy = this.actionsList.slice();
        if (state.getItem('ReleaseControl', false)) {
            state.setItem('ReleaseControl', false);
        } else {
            utility.log(3, "ReleaseControl to unshift LastAction");
            actionsListCopy.unshift(state.getItem('LastAction', 'Idle'));
        }

        for (action = 0, len = actionsListCopy.length; action < len; action += 1) {
            if (this[actionsListCopy[action]]()) {
                this.CheckLastAction(actionsListCopy[action]);
                break;
            }
        }

        this.WaitMainLoop();
    },

    waitMilliSecs: 5000,

    WaitMainLoop: function () {
        utility.log(5, 'waitMilliSecs', this.waitMilliSecs);
        utility.setTimeout(function () {
            caap.waitMilliSecs = 5000;
            if (caap.flagReload) {
                caap.ReloadCastleAge();
            }

            caap.MainLoop();
        }, this.waitMilliSecs * (1 + Math.random() * 0.2));
    },

    ReloadCastleAge: function () {
        // better than reload... no prompt on forms!
        if (!config.getItem('Disabled') && (state.getItem('caapPause') === 'none')) {
            utility.VisitUrl("http://apps.facebook.com/castle_age/index.php?bm=1&ref=bookmarks&count=0");
        }
    },

    ReloadOccasionally: function () {
        var reloadMin = gm.getItem('ReloadFrequency', 8, hiddenVar);
        if (!reloadMin || reloadMin < 8) {
            reloadMin = 8;
        }

        utility.setTimeout(function () {
            if (schedule.since('clickedOnSomething', 5 * 60) || caap.pageLoadCounter > 40) {
                utility.log(1, 'Reloading if not paused after inactivity');
                caap.flagReload = true;
            }

            caap.ReloadOccasionally();
        }, 60000 * reloadMin + (reloadMin * 60000 * Math.random()));
    }
};
