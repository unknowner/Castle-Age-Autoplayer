/////////////////////////////////////////////////////////////////////
//                              FILL ARMY
/////////////////////////////////////////////////////////////////////

caap.addFriendSpamCheck = 0;

caap.autoFillArmy = function() {
	try {
		if(!state.getItem('FillArmy', false) || !config.getItem("EnableArmy", true) || caap.domain.which === 0 || caap.domain.which === 1 || caap.domain.which === 4) {
			return false;
		}

		function addFriend(id) {
			try {
				function responseCallback(data, textStatus, XMLHttpRequest) {
					if(caap.addFriendSpamCheck > 0) {
						caap.addFriendSpamCheck -= 1;
					}

					con.log(1, "AddFriend(" + id + "): ", textStatus);
				}


				caap.ajax('party.php?twt=jneg&jneg=true&user=' + id + '&lka=' + id + '&etw=9&ref=nf', null, responseCallback, responseCallback);
				//caap.ajax('index.php?tp=cht&buf=1&lka=' + id, null, responseCallback, responseCallback);
				return true;
			} catch (err) {
				con.error("ERROR in addFriend(" + id + "): " + err);
				return false;
			}
		}

		var armyCount = state.getItem("ArmyCount", 0), fillArmyList = state.getItem('FillArmyList', []), batchCount = 5, i = 0;

		con.log(2, "fillArmyList:", fillArmyList);
		con.log(2, "armyCount:", armyCount);
		if(armyCount === 0) {
			fillArmyList = state.setItem('FillArmyList', army.getDiffList());
			if($u.hasContent(fillArmyList)) {
				caap.setDivContent('idle_mess', 'Filling Army');
				con.log(1, "Filling army");
			} else {
				caap.setDivContent('idle_mess', '<span style="font-weight: bold;">Fill Army Completed</span>');
				con.log(1, "Fill Army Completed: no friends found");
				window.setTimeout(function() {
					caap.setDivContent('idle_mess', '');
				}, 5000);

				state.setItem('FillArmy', false);
				state.setItem("ArmyCount", 0);
				state.setItem('FillArmyList', []);
				return false;
			}
		}

		if($u.hasContent(fillArmyList)) {
			con.log(2, "inside");
			// Add army members //
			if(fillArmyList.length < 5) {
				batchCount = fillArmyList.length;
			} else if(fillArmyList.length - armyCount < 5) {
				batchCount = fillArmyList.length - armyCount;
			}
			batchCount = batchCount - caap.addFriendSpamCheck;
			for( i = 0; i < batchCount; i += 1) {
				addFriend(fillArmyList[armyCount]);
				armyCount += 1;
				caap.addFriendSpamCheck += 1;
			}

			caap.setDivContent('idle_mess', 'Filling Army, Please wait...' + armyCount + "/" + fillArmyList.length);
			con.log(1, 'Filling Army, Please wait...' + armyCount + "/" + fillArmyList.length);
			state.setItem("ArmyCount", armyCount);
			if(armyCount >= fillArmyList.length) {
				caap.setDivContent('idle_mess', '<span style="font-weight: bold;">Fill Army Completed</span>');
				window.setTimeout(function() {
					caap.setDivContent('idle_mess', '');
				}, 5000);

				con.log(1, "Fill Army Completed");
				state.setItem('FillArmy', false);
				state.setItem("ArmyCount", 0);
				state.setItem('FillArmyList', []);
				return false;
			}
		}

		con.log(2, "At end returning true");
		return true;
	} catch (err) {
		con.error("ERROR in autoFillArmy: " + err);
		caap.setDivContent('idle_mess', '<span style="font-weight: bold;">Fill Army Failed</span>');
		window.setTimeout(function() {
			caap.setDivContent('idle_mess', '');
		}, 5000);

		state.setItem('FillArmy', false);
		state.setItem("ArmyCount", 0);
		state.setItem('FillArmyList', []);
		return false;
	}
};
