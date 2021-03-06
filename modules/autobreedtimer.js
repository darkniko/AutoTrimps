

//Controls "Auto Breed Timer" and "Geneticist Timer" - adjust geneticists to reach desired breed timer
function autoBreedTimer() {
    var fWorkers = Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed;
    if(getPageSetting('ManageBreedtimer')) {
        if(game.options.menu.showFullBreed.enabled != 1) toggleSetting("showFullBreed");

        if(game.portal.Anticipation.level == 0) autoTrimpSettings.GeneticistTimer.value = '0';
        else if(game.global.challengeActive == 'Electricity' || game.global.challengeActive == 'Mapocalypse') autoTrimpSettings.GeneticistTimer.value = '3.5';
        else if(game.global.challengeActive == 'Nom' || game.global.challengeActive == 'Toxicity') {

            if(getPageSetting('FarmWhenNomStacks7') && game.global.gridArray[99].nomStacks >= 5 && !game.global.mapsActive) {
                //if Improbability already has 5 nomstacks, do 30 antistacks.
                autoTrimpSettings.GeneticistTimer.value = '30';
                //actually buy them here because we can't wait.
                safeBuyJob('Geneticist', 1+(autoTrimpSettings.GeneticistTimer.value - getBreedTime())*2);
            }
            else
                autoTrimpSettings.GeneticistTimer.value = '10';
        }
        else autoTrimpSettings.GeneticistTimer.value = '30';
    }
    var inDamageStance = game.upgrades.Dominance.done ? game.global.formation == 2 : game.global.formation == 0;
    var inScryerStance = (game.global.world >= 60 && game.global.highestLevelCleared >= 180) && game.global.formation == 4;
    //(inDamageStance||inScryerStance);
    var targetBreed = parseInt(getPageSetting('GeneticistTimer'));
    //if we need to hire geneticists
    //Don't hire geneticists if total breed time remaining is greater than our target breed time
    //Don't hire geneticists if we have already reached 30 anti stacks (put off further delay to next trimp group)
    if (targetBreed > getBreedTime() && !game.jobs.Geneticist.locked && targetBreed > getBreedTime(true) && (game.global.lastBreedTime/1000 + getBreedTime(true) < autoTrimpSettings.GeneticistTimer.value) && game.resources.trimps.soldiers > 0 && !breedFire) {
        //insert 10% of total food limit here? or cost vs tribute?
        //if there's no free worker spots, fire a farmer
        if (fWorkers < 1)
            //do some jiggerypokery in case jobs overflow and firing -1 worker does 0 (java integer overflow)
            safeFireJob('Farmer');
        if (canAffordJob('Geneticist', false, 1)) {
            //hire a geneticist
            safeBuyJob('Geneticist', 1);
        }
    }
    //if we need to speed up our breeding
    //if we have potency upgrades available, buy them. If geneticists are unlocked, or we aren't managing the breed timer, just buy them
    if ((targetBreed < getBreedTime() || !game.jobs.Geneticist.locked || !getPageSetting('ManageBreedtimer') || game.global.challengeActive == 'Watch') && game.upgrades.Potency.allowed > game.upgrades.Potency.done && canAffordTwoLevel('Potency') && getPageSetting('BuyUpgrades')) {
        buyUpgrade('Potency');
    }
    //otherwise, if we have some geneticists, start firing them
    else if ((targetBreed*1.02 < getBreedTime() || targetBreed*1.02 < getBreedTime(true)) && !game.jobs.Geneticist.locked && game.jobs.Geneticist.owned > 10) {
        safeBuyJob('Geneticist', -10);
        //debug('fired 10 geneticist');
    }
    //if our time remaining to full trimps is still too high, fire some jobs to get-er-done
    //needs option to toggle? advanced options?
    else if ((targetBreed < getBreedTime(true) || (game.resources.trimps.soldiers == 0 && getBreedTime(true) > 6)) && breedFire == false && getPageSetting('BreedFire') && game.global.world > 10) {
        breedFire = true;
    }

    //reset breedFire once we have less than 2 seconds remaining
    if(getBreedTime(true) < 2) breedFire = false;

    //Force Abandon Code (AutoTrimpicide):
    var newSquadRdy = game.resources.trimps.realMax() <= game.resources.trimps.owned + 1;
    var nextgrouptime = (game.global.lastBreedTime/1000);
    if  (targetBreed > 30) targetBreed = 30; //play nice with custom timers over 30.
    var newstacks = nextgrouptime >= targetBreed ? targetBreed : nextgrouptime;
    //kill titimp if theres less than 5 seconds left on it or, we stand to gain more than 5 antistacks.
    var killTitimp = (game.global.titimpLeft < 5 || (game.global.titimpLeft >= 5 && newstacks - game.global.antiStacks >= 5))
    if (getPageSetting('ForceAbandon') && game.portal.Anticipation.level && game.global.antiStacks < targetBreed && game.resources.trimps.soldiers > 0 && killTitimp) {
        //if a new fight group is available and anticipation stacks aren't maxed, force abandon and grab a new group
        if (newSquadRdy && nextgrouptime >= targetBreed) {
            forceAbandonTrimps();
        }
        //if we're sitting around breeding forever and over 5 anti stacks away from target.
        else if (nextgrouptime >= 60 && newstacks - game.global.antiStacks >= 5) {
            forceAbandonTrimps();
        }
    }
}

//Abandon trimps function that should handle all special cases.
function forceAbandonTrimps() {
    //dont if <z6 (no button)
    if (!game.global.mapsUnlocked) return;
    //dont if were in a voidmap
    if (game.global.mapsActive && getCurrentMapObject().location == "Void") return;
    //dont if were on map-selection screen.
    if (game.global.preMapsActive) return;
    //dont if we are in spire:
    if (game.global.world == 200 && game.global.spireActive && !game.global.mapsActive) return;
    if (getPageSetting('AutoMaps')) {
        mapsClicked();
        //force abandon army
        if (game.global.switchToMaps || game.global.switchToWorld)
            mapsClicked();
    }
    //in map without automaps
    else if (game.global.mapsActive) {
        mapsClicked();
        if (game.global.switchToMaps)
            mapsClicked();
        runMap();
    }
    //in world without automaps
    else  {
        mapsClicked();
        if (game.global.switchToMaps)
            mapsClicked();
        mapsClicked();
    }
    debug("Killed your army! (to get " + parseInt(getPageSetting('GeneticistTimer')) + " Anti-stacks). Trimpicide successful.","other");
}