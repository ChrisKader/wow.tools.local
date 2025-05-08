//@ts-check

/** 
 * @typedef CurrentParams
 * @property {string} dbc
 * @property {string} build 
*/

/** @type {CurrentParams} */
let currentParams = {
    dbc: "SceneScriptPackage",
    build: "unknown"
};

/**
 * @param {string} build
*/
function setCurrentBuild(build) {
    currentParams.build = build;
}

function getCurrentBuild() {
    return currentParams.build;
}

function toggleTable() {
    if ($("#dbtable_wrapper > .dt-layout-table").is(":visible")){
        $("#dbtable_wrapper > .dt-layout-table").hide()
    } else if ($("#dbtable_wrapper > .dt-layout-table").is(":hidden")){
        $("#dbtable_wrapper > .dt-layout-table").show()
    }
}

/**
 * @param {string|number} table
 * @param {string|number} build
 * @param {string|number} col
 * @param {string|number} val
 *
*/
async function fetchDBRow(table, build, col, val) {
    const fetchUrl = `/dbc/find/${table}?build=${build}&col=${col}&val=${val}&useHotfixes=true`;
    const result = await fetch(fetchUrl);
    const json = await result.json();
    return json;
}

let url = new URL(window.location.href);
let searchParams = new URLSearchParams(url.search);
let urlBuild = searchParams.get("build");

// grab the build from the URL if it's present, otherwise just use whatever is selected in the dropdown
if (urlBuild != null) {
    setCurrentBuild(urlBuild)
} else {
    setCurrentBuild($("#buildFilter").val()?.toString() || "unknown");    
} 


/** @type {Array<string>} */
let knownManifests = new Array();

async function updateManifests() {
    const response = await fetch('/casc/listManifests')
    /** @type {string[]?} */
    const manifests = await response.json()
    if (manifests == null) {
        console.error("No manifest data found");
        return;
    } else {
        console.log("Manifests:", manifests);
        for (let j = 0; j < manifests.length; j++) {
            if (currentParams.build == "unknown") {
                setCurrentBuild(manifests[j]);
            }
            if (!knownManifests.includes(manifests[j])){
                knownManifests.push(manifests[j]);
            }
        }
    }
}

/** @type {HTMLElement} */
// @ts-ignore
const scriptContainer = document.getElementById("scriptContainer");
//const loadingHolder = document.getElementById("loadingHolder");

/**
 * 
 * @param {string} build 
 * @param {number} sceneScriptId 
*/
async function getSceneScript(build, sceneScriptId){
    /**
     * @typedef SceneScript
     * @property {number} id
     * @property {number} firstSceneScriptId
     * @property {number} nextSceneScriptId
    */

    let sceneScriptRes = await fetchDBRow("scenescript", build, "ID", sceneScriptId);
    if (sceneScriptRes.length == 0){
        console.error("SceneScript not found", sceneScriptId);
        return
    } else {
        if (sceneScriptRes[0].FirstSceneScriptID !== '0'){
            console.warn("getSceneScript", sceneScriptId, "Found first scene script " + sceneScriptRes[0].FirstSceneScriptID, sceneScriptRes);
        }
        if (sceneScriptRes.length > 1){
            console.warn("getSceneScript", sceneScriptId, "Found multiple scene scripts " + sceneScriptRes.length, sceneScriptRes);
        }

        /** @type {SceneScript} */
        const sceneScript = {
            id: sceneScriptRes[0].ID,
            firstSceneScriptId: sceneScriptRes[0].FirstSceneScriptID,
            nextSceneScriptId: sceneScriptRes[0].NextSceneScriptID
        }
        return sceneScript
    }
}

/**
 * 
 * @param {string} build
 * @param {number} sceneScriptId
*/
async function getSceneScriptText2(build, sceneScriptId){
    /**
     * @typedef SceneScriptText
     * @property {number} id
     * @property {string} name
     * @property {string} script
    */

    let sceneTextRes = await fetchDBRow("scenescripttext", build, "ID", sceneScriptId);
    if (sceneTextRes.length == 0){
        console.error("SceneScriptText not found", sceneScriptId);
        return 
    } else {
        if (sceneTextRes.length > 1){
            console.log("getSceneScriptText", sceneScriptId, "Found multiple scenescripttext matches " + sceneTextRes.length, sceneTextRes);
        }
        /** @type {SceneScriptText} */
        const sceneScriptText = {
            id: sceneTextRes[0].ID,
            name: sceneTextRes[0].Name,
            script: sceneTextRes[0].Script
        }
        return sceneScriptText
    }
}

/**
 * 
 * @param {string} build
 * @param {number} sceneScriptId
 * 
*/
async function mergeSceneScriptText(build, sceneScriptId){
    console.log('mergeSceneScriptText', sceneScriptId);
    const scriptText = {
        id: sceneScriptId,
        name: "unknown",
        SceneScriptTexts: new Set(),
        textSet: new Set(),
        text: "",
    }
    let sceneScriptText = await getSceneScriptText2(build, sceneScriptId)
    if (sceneScriptText === undefined){
        console.error("SceneScriptText not found", sceneScriptId);
        return
    }
    let sceneScript = await getSceneScript(build, sceneScriptId);
    if (typeof(sceneScript) === "undefined"){
        console.error("SceneScript not found", sceneScriptId);
        return
    }

    if (sceneScriptText.name.length > 0){
        scriptText.name = sceneScriptText.name;
    }

    scriptText.SceneScriptTexts.add(sceneScriptText);
    scriptText.textSet.add(sceneScriptText.script);
    scriptText.text = scriptText.text.concat(sceneScriptText.script);

    let sceneId = sceneScript.nextSceneScriptId

    console.log("mergeSceneScriptText Starting loop", sceneId);
    while (sceneId != 0) {
        console.log("mergeSceneScriptText while loop", sceneId);
        sceneScript = await getSceneScript(build, sceneId);
        sceneScriptText = await getSceneScriptText2(build, sceneId);
        if (sceneScript === undefined){
            sceneId = 0;
            console.error("SceneScriptText not found", sceneId);
            return 
        }
        if (sceneScriptText === undefined){
            sceneId = 0;
            console.error("SceneScriptText not found", sceneId);
            return 
        }
        scriptText.SceneScriptTexts.add(sceneScriptText);
        scriptText.textSet.add(sceneScriptText.script);
        scriptText.text = scriptText.text.concat(sceneScriptText.script);
        sceneId = sceneScript.nextSceneScriptId;
    }
    return scriptText

}

/**
 * @param {string} build
 * @param {number} sceneScriptId
*/
// async function getSceneScriptText(build, sceneScriptId) {
//     let sceneRow = await fetchDBRow("scenescript", build, "ID", sceneScriptId);
//     let sceneTextRow = await fetchDBRow("scenescripttext", build, "ID", sceneScriptId);
//     console.log("getSceneScriptText", sceneScriptId, sceneRow, sceneTextRow);
//     /** @type {Set<string>} */
//     const scriptText = new Set();

//     if (sceneTextRow.length !== 0) {
//         scriptText.add(sceneTextRow[0].Script);
//     }
//     if (sceneRow.length !== 0) {
//         while (sceneRow[0].NextSceneScriptID != '0') {
//             var sceneID = sceneRow[0].NextSceneScriptID;
//             const text = await getSceneScriptText(build, sceneID)
//             for(let [k, v] of text){
//                 scriptText.add(v);
//             }
//             //sceneRow = await fetchDBRow("scenescript", build, "ID", sceneID);
//             //sceneTextRow = await fetchDBRow("scenescripttext", build, "ID", sceneID);
//             //scriptContainer.insertAdjacentHTML('beforeend', sceneTextRow[0].Script);
//             //pkgMbr.scriptText.add(sceneTextRow[0].Script);
//         }
//     }
//     return scriptText
// }

/**
 * @typedef APISceneScriptPackageMember
 * @property {number} ChildSceneScriptPackageID
 * @property {number} ID
 * @property {number} OrderIndex
 * @property {number} SceneScriptID
 * @property {number} SceneScriptPackageID
*/

/** @typedef {APISceneScriptPackageMember[]} APISceneScriptPackageMembers */

/** @param {string} build */
/** @param {number} sceneScriptPackageID */
async function getSceneScriptPackageMembers(build, sceneScriptPackageID) {
    /** @type {APISceneScriptPackageMembers} */
    let subPackageMembers = await fetchDBRow("scenescriptpackagemember", build, "SceneScriptPackageID", sceneScriptPackageID);
    subPackageMembers.sort(function (a, b) { return a.OrderIndex - b.OrderIndex; });
    return subPackageMembers
}

/**
 * @param {string} build
 * @param {number} sceneScriptId
*/
async function buildSceneScript(build, sceneScriptId){
    const sceneScriptText = await mergeSceneScriptText(build, sceneScriptId);
    console.log("buildSceneScript", sceneScriptId, sceneScriptText);
    console.log("buildSceneScript", sceneScriptId, sceneScriptText?.text);

}

/**
 * @param {string} build
 * @param {number} sceneScriptPackageID
 * @param {Map<number, PackageMember>|undefined} dependencies
*/
async function buildSceneScriptPackage(build, sceneScriptPackageID, dependencies){

    /**
     * @typedef ScriptPackage
     * @property {number} id
     * @property {Set<PackageMember>} members
     * @property {Map<number, PackageMember>} dependencies
     */

    const scriptPackage = {
        id: sceneScriptPackageID,
        members: new Set(),
        dependencies: dependencies || new Map(),
        scriptTextSet: new Set(),
        scriptText: '',

    }
    const initText = `-- WoW.tools debug output: Start of package ${sceneScriptPackageID}\n`
    scriptPackage.scriptTextSet.add(initText);
    scriptPackage.scriptText = initText + '\n';
    const members = await getSceneScriptPackageMembers(build, sceneScriptPackageID);
    console.log('[buildSceneScriptPackage]', sceneScriptPackageID, members, dependencies);
    for (const packageMember of members) {
        if (packageMember.ChildSceneScriptPackageID != 0){
            console.log('[buildSceneScriptPackage]',`ChildSceneScriptPackageID is ${packageMember.ChildSceneScriptPackageID} for ${packageMember.SceneScriptID} in package ${scriptPackage.id}.`);
            if (!scriptPackage.dependencies.has(packageMember.ChildSceneScriptPackageID)){
                console.log('[buildSceneScriptPackage]',`Dependency ${packageMember.ChildSceneScriptPackageID} not found for script package ${scriptPackage.id}. Checking imported packages...`);
                if (dependencies && dependencies.has(packageMember.ChildSceneScriptPackageID)){
                    const dependancy = dependencies.get(packageMember.ChildSceneScriptPackageID);
                    if (dependancy){
                        console.log('[buildSceneScriptPackage]',`Dependency ${packageMember.ChildSceneScriptPackageID} already added for script package ${scriptPackage.id} via imported.`);
                        scriptPackage.dependencies.set(dependancy.id, dependancy);
                        const text = `-- WoW.tools debug output: package ${dependancy.id} added already.`
                        scriptPackage.scriptTextSet.add(text);
                        scriptPackage.scriptText = scriptPackage.scriptText.concat("\n" + text + "\n");
                    }
                } else {
                    console.log('[buildSceneScriptPackage]',`Dependency ${packageMember.ChildSceneScriptPackageID} not found for script package ${scriptPackage.id} in imports. Building dependency...`);
                    const depScriptPackage = await buildSceneScriptPackage(build, packageMember.ChildSceneScriptPackageID, scriptPackage.dependencies);
                    scriptPackage.dependencies.set(depScriptPackage.id, depScriptPackage);
                    scriptPackage.scriptTextSet.add(depScriptPackage.scriptText);
                    scriptPackage.scriptText = scriptPackage.scriptText.concat("\n" + depScriptPackage.scriptText + "\n");
                }
            } else {
                const dependancy = scriptPackage.dependencies.get(packageMember.ChildSceneScriptPackageID);
                if (dependancy){
                    console.log('[buildSceneScriptPackage]',`Dependency ${packageMember.ChildSceneScriptPackageID} already added for script package ${scriptPackage.id}.`);
                    const text = `-- WoW.tools debug output: package ${dependancy.id} added already.`
                    scriptPackage.scriptTextSet.add(text);
                    scriptPackage.scriptText = scriptPackage.scriptText.concat("\n" + text + "\n");
                }
            }
        } else {
            console.log('[buildSceneScriptPackage]',`ChildSceneScriptPagekageID is 0 for ${packageMember.SceneScriptID} in package ${scriptPackage.id}.`);
            const sceneScriptText = await mergeSceneScriptText(build, packageMember.SceneScriptID);
            if(sceneScriptText){
                console.log('[buildSceneScriptPackage]',`Merged scene script text for ${packageMember.SceneScriptID} in package ${scriptPackage.id}.`);
                const text = `-- WoW.tools debug output: SceneScript name: ${sceneScriptText.name}`
                scriptPackage.scriptTextSet.add(text);
                scriptPackage.scriptTextSet.add(sceneScriptText.text);
                scriptPackage.scriptText = scriptPackage.scriptText.concat("\n" + text + "\n");
                scriptPackage.scriptText = scriptPackage.scriptText.concat("\n" + sceneScriptText.text + "\n");
            }
        }
    }
    return scriptPackage
}

/**
 * @typedef PackageMember
 * @property {number} childSceneScriptPackageID
 * @property {number} sceneScriptPackageID
 * @property {number} sceneScriptID
 * @property {number} id
 * @property {Set<PackageMember>} dependencies
 * @property {Map<number, PackageMember>} scriptPackages
 * @property {number} orderIndex
 * @property {Set<string>} scriptText
*/


/**
 * @param { string } build
 * @param { APISceneScriptPackageMembers } packageMembers
*/
async function buildSceneScriptDependencyTree(build, packageMembers) {
    packageMembers.sort(function (a, b) { return a.OrderIndex - b.OrderIndex; });

    /** @type {Set<PackageMember>} */
    const PackageMembers = new Set();
    for (const member of packageMembers) {

        /** @type {PackageMember} */
        const pkgMbr = {
            childSceneScriptPackageID: member.ChildSceneScriptPackageID,
            id: member.ID,
            sceneScriptPackageID: member.SceneScriptPackageID,
            sceneScriptID: member.SceneScriptID,
            /** @type {Set<PackageMember>} */
            dependencies: new Set(),
            scriptPackages: new Map(),
            orderIndex: member.OrderIndex,
            scriptText: new Set(),
        }
        
        if (member.ChildSceneScriptPackageID != 0){
            /** @type {packageMembers} */
            if (pkgMbr.scriptPackages.has(member.ChildSceneScriptPackageID)){
                const dependancy = pkgMbr.scriptPackages.get(member.ChildSceneScriptPackageID);
                if (dependancy){
                    pkgMbr.dependencies.add(dependancy);
                }
            } else {
                const subPackageMembers = await getSceneScriptPackageMembers(build, member.ChildSceneScriptPackageID);
                const subPackage = await buildSceneScriptDependencyTree(build, subPackageMembers);
                console.log('[buildSceneScriptDependencyTree]', `Found child package ${member.ChildSceneScriptPackageID} for ${member.SceneScriptID} in package ${member.SceneScriptPackageID}.`, subPackage);
                //pkgMbr.scriptPackages.set(member.ChildSceneScriptPackageID, subPackage);
            }
        } else {
            //console.log("Found scene script " + member.SceneScriptID);
            let sceneRow = await fetchDBRow("scenescript", build, "ID", member.SceneScriptID);
            let sceneTextRow = await fetchDBRow("scenescripttext", build, "ID", member.SceneScriptID);
            if (sceneTextRow.length !== 0) {
                pkgMbr.scriptText.add(sceneTextRow[0].Script);
            }
            if (sceneRow.length !== 0) {
                while (sceneRow[0].NextSceneScriptID != '0') {
                    var sceneID = sceneRow[0].NextSceneScriptID;
                    sceneRow = await fetchDBRow("scenescript", build, "ID", sceneID);
                    sceneTextRow = await fetchDBRow("scenescripttext", build, "ID", sceneID);
                    //scriptContainer.insertAdjacentHTML('beforeend', sceneTextRow[0].Script);
                    pkgMbr.scriptText.add(sceneTextRow[0].Script);
                }
            }
        }
        PackageMembers.add(pkgMbr);
    }
    return PackageMembers
}

/**
 * @param {number} packageid
 * @param {string} build
*/
async function loadSceneScript(packageid, build) {
    scriptContainer.innerHTML = "";
    //loadingHolder.innerText = "Loading scene, please wait...";
    console.log("loading scenescript package " + packageid + " from build " + build);
    //const basePackageMembers = await fetchDBRow("scenescriptpackagemember", build, "SceneScriptPackageID", packageid);
    const basePackageMembers = await getSceneScriptPackageMembers(build, packageid);
    console.log("basePackageMembers", basePackageMembers);
    console.log("building dependency tree", await buildSceneScriptDependencyTree(build, basePackageMembers));
    let parms = {
        text: "",
        /** @type {Array<number>} */
        loadedScripts: [],
        build: build,
        /** @type {Array<string>} */
        children: [],
    };
    for (const entry of basePackageMembers) {
        console.log('[loadSceneScript]', entry, parms);
        parms = await handlePackageMember(entry, parms);
    }
    
    // @ts-ignore
    const res = hljs.highlight(parms.text, { language: 'lua' });
    if (res.value){
        scriptContainer.insertAdjacentHTML('beforeend', res.value);
    }
    //hljs.highlightElement(document.getElementById("scriptContainer"));
    //loadingHolder.innerText = "";

}   

/**
 * @param {{text: string, loadedScripts: Array<number>, build: string, children: string[]}} parms
*/
async function handlePackageMember(packageMember, parms) {
    if (packageMember.ChildSceneScriptPackageID != 0) {
        parms.children.push(packageMember.ChildSceneScriptPackageID);
        // console.log("Found child package " + packageMember.ChildSceneScriptPackageID);
        console.log('[handlePackageMember]', `ChildSceneScriptPackageID ${packageMember.ChildSceneScriptPackageID} for ${packageMember.SceneScriptID} in package ${packageMember.SceneScriptPackageID}.`);
        //scriptContainer.insertAdjacentHTML('beforeend', "\n\n-- WoW.tools debug output: Start of package " + packageMember.ChildSceneScriptPackageID + "\n");
        parms.text = parms.text.concat("\n\n-- WoW.tools debug output: Start of package " + packageMember.ChildSceneScriptPackageID + "\n");
        let subPackageMembers = await fetchDBRow("scenescriptpackagemember", parms.build, "SceneScriptPackageID", packageMember.ChildSceneScriptPackageID);

        subPackageMembers.sort(function (a, b) { return a.OrderIndex - b.OrderIndex; });
        console.log('[handlePackageMember]', "subPackageMembers", subPackageMembers);
        for (const entry of subPackageMembers) {
            parms = await handlePackageMember(entry, parms)
            parms.text = parms.text.concat(parms.text)
        }
        //scriptContainer.insertAdjacentHTML('beforeend', "\n\n--WoW.tools debug output: End of package " + packageMember.ChildSceneScriptPackageID + "\n\n");
        parms.text = parms.text.concat("\n\n-- WoW.tools debug output: End of package " + packageMember.ChildSceneScriptPackageID + "\n\n");

        // console.log("sub " + packageMember.ChildSceneScriptPackageID, subPackageMembers);
    } else {
        // console.log(packageMember.SceneScriptPackageID + " scene", packageMember.SceneScriptID);
        console.log('[handlePackageMember]', `SceneScriptID: ${packageMember.SceneScriptID}, Package: ${packageMember.SceneScriptPackageID}.`);
        let sceneRow = await fetchDBRow("scenescript", parms.build, "ID", packageMember.SceneScriptID);
        let sceneTextRow = await fetchDBRow("scenescripttext", parms.build, "ID", packageMember.SceneScriptID);
        console.log('[handlePackageMember]', `ChildSceneScriptPackageID ${packageMember.ChildSceneScriptPackageID} for ${packageMember.SceneScriptID} in package ${packageMember.SceneScriptPackageID}.`);
        if (sceneTextRow.length == 0) {
            //scriptContainer.insertAdjacentHTML('beforeend', "\n\n-- WoW.tools debug output: !!! SceneScript ID " + packageMember.SceneScriptID + " not found, possibly encrypted\n\n");
            parms.text = parms.text.concat("\n\n-- WoW.tools debug output: !!! SceneScript ID " + packageMember.SceneScriptID + " not found, possibly encrypted\n\n");
        } else {
            //scriptContainer.insertAdjacentHTML('beforeend', "\n\n-- WoW.tools debug output: SceneScript name: " + sceneTextRow[0].Name + "\n\n");
            parms.text = parms.text.concat("\n\n-- WoW.tools debug output: SceneScript name: " + sceneTextRow[0].Name + "\n\n");
            //scriptContainer.insertAdjacentHTML('beforeend', sceneTextRow[0].Script);
            parms.text = parms.text.concat(sceneTextRow[0].Script);
            parms.loadedScripts.push(packageMember.SceneScriptID);
        }

        if (sceneRow.length == 0) {
            //scriptContainer.insertAdjacentHTML('beforeend', "\n\n-- WoW.tools debug output: !!! SceneScript ID " + packageMember.SceneScriptID + " not found, possibly encrypted\n\n");
            parms.text = parms.text.concat("\n\n-- WoW.tools debug output: !!! SceneScript ID " + packageMember.SceneScriptID + " not found, possibly encrypted\n\n");
        } else {
            //console.log("sceneRow[0].ID", sceneRow[0].ID);
            while (sceneRow[0].NextSceneScriptID != '0') {
                console.log(`[handlePackageMember]`, `NextSceneScriptID ${sceneRow[0].NextSceneScriptID} for ${packageMember.SceneScriptID} in package ${packageMember.SceneScriptPackageID}.`);
                var sceneID = sceneRow[0].NextSceneScriptID;
                sceneRow = await fetchDBRow("scenescript", parms.build, "ID", sceneID);
                sceneTextRow = await fetchDBRow("scenescripttext", parms.build, "ID", sceneID);
                //scriptContainer.insertAdjacentHTML('beforeend', sceneTextRow[0].Script);
                parms.text = parms.text.concat(sceneTextRow[0].Script);
                parms.loadedScripts.push(packageMember.SceneScriptID);
            }
        }
    };
    return parms;
}

function copyScript() {
    // @ts-ignore
    navigator.permissions.query({ name: "clipboard-write" }).then(result => {
        if (result.state == "granted" || result.state == "prompt") {
            navigator.clipboard.writeText(scriptContainer.innerText).then(function () {
                console.log("Copied to clipboard");
            }, function () {
                console.log("Copy failed");
            });
        }
    });
}

function loadTable() {
    /* build = currentParams.build; */

    $("#dbtable").html("<tbody><tr><td style='text-align: center' id='loadingMessage'>Select a table in the dropdown above</td></tr></tbody>");
    $("#loadingMessage").html("Loading..");

    let apiArgs = currentParams.dbc + "/?build=" + currentParams.build;
    apiArgs += "&useHotfixes=true";
    let tableHeaders = "";
    /** @type {string|number|symbol} */
    let idHeader = 0;
    console.log("apiArgs", apiArgs)
    $.ajax({
        "url": "/dbc/header/" + currentParams.dbc + "/?build=" + currentParams.build,
        "success": function (json) {
            if (json['error'] != null) {
                if (json['error'] == "No valid definition found for this layouthash or build!") {
                    json['error'] += "\n\nPlease open an issue on the WoWDBDefs repository with the DBC name and selected version on GitHub to request a definition for this build.\n\nhttps://github.com/wowdev/WoWDBDefs";
                }
                $("#loadingMessage").html("<div class='alert '><b>Whoops, something exploded while loading this DBC</b><br>It is possible this is due to maintenance or an issue with reading the DBC file itself. Please try again later or report the below error (together with the table name and version) in Discord if it persists. Thanks!</p><p style='margin: 5px;'><kbd>" + json['error'] + "</kbd></p></div>");
                return;
            }
            let allCols = [];
            $.each(json['headers'], function (i, val) {
                tableHeaders += "<th style='white-space: nowrap'>";

                tableHeaders += val;

                tableHeaders += "</th>";

                if (val == "ID") {
                    idHeader = i;
                }
                allCols.push(i);
            });

            $("#tableContainer").empty();
            $("#tableContainer").append('<table id="dbtable" class="table table-striped table-bordered table-condensed" cellspacing="0" width="100%"><thead><tr>' + tableHeaders + '</tr></thead></table>');

            let searchHash = location.hash.substr(1),
                searchString = searchHash.substr(searchHash.indexOf('search=')).split('&')[0].split('=')[1];

            if (searchString != undefined && searchString.length > 0) {
                searchString = decodeURIComponent(searchString);
            }

            let page = (parseInt(searchHash.substr(searchHash.indexOf('page=')).split('&')[0].split('=')[1], 10) || 1) - 1;
            let highlightRow = parseInt(searchHash.substr(searchHash.indexOf('row=')).split('&')[0].split('=')[1], 10) - 1;
            $.fn.dataTable.ext.errMode = 'none';
            $('#dbtable').on('error.dt', function (e, settings, techNote, message) {
                console.log('An error occurred: ', message);
            });

        
            var table = $('#dbtable').DataTable({
                scrollCollapse: true,
                scrollY: '25vh',
                processing: true,
                serverSide: true,
                ajax: {
                    url: "/dbc/data/" + apiArgs,
                    type: "POST",
                    beforeSend: function () {
                        if (table && table.hasOwnProperty('settings')) {
                            // table.settings()[0].jqXHR.abort();
                        }
                    },
                    "data": function (result) {
                        for (const col in result.columns) {
                            result.columns[col].search.value = result.columns[col].search.value.trim();
                        }
                        return result;
                    }
                },
                pageLength: 20,
                displayStart: page * 20,
                autoWidth: true,
                lengthMenu: [[10, 20, 50, 100, 1000], [10, 20, 50, 100, 1000]],
                orderMulti: false,
                layout: {
                    topStart: {
                        features: {buttons:[]},
                    },
                    bottomStart: {
                        info: {},
                        pageLength:{}, 
                    },
                    bottomEnd: 'inputPaging'
                },
                ordering: true,
                order: [], // Sets default order to nothing (as returned by backend)
                language: { "search": "Search: _INPUT_ " },
                search: { "search": searchString },
                columnDefs: [
                    {
                        "targets": allCols,
                        "render": function (data, type, full, meta) {
                            let returnVar = full[meta.col];
                            return returnVar;
                        }
                    }],
            });

            table.button().add(0, {
                action: function (e, dt, node, config) {
                    if ($("#dbtable_wrapper > .dt-layout-table").is(":visible")){
                        $("#dbtable_wrapper > .dt-layout-table").hide()
                    } else if ($("#dbtable_wrapper > .dt-layout-table").is(":hidden")){
                        $("#dbtable_wrapper > .dt-layout-table").show()
                    }
                },
                text: 'Toggle',
            })
            table.button().add(1, {
                extend: 'collection',
                text: 'Build',
                buttons: knownManifests.map((build)=>{
                    return { text: build, action: function (e, dt, node, config) {
                        setCurrentBuild(build)
                        document.location = '/dbc/scenescript.html?build=' + build;
                    } }
                    
                })
            })
            table.button().add(2, {
                text: 'Copy Script',
                action: function (e, dt, node, config) {
                    // @ts-ignore
                    navigator.permissions.query({ name: "clipboard-write" }).then(result => {
                        if (result.state == "granted" || result.state == "prompt") {
                            const scriptCont = document.getElementById("scriptContainer")
                            if (scriptCont){
                                navigator.clipboard.writeText(scriptCont.innerText).then(function () {
                                console.log("Copied to clipboard");
                            }, function () {
                                console.log("Copy failed");
                            });
                            }
                        }
                    });
                }
            });
            table.button().add(3, {
                text: 'Save Scripts',
                action: function (e, dt, node, config) {
                    const scriptCont = document.getElementById("scriptContainer")
                    if (scriptCont){
                        const blob = new Blob([scriptCont.innerText], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'scenescript.lua';
                        a.click();
                        URL.revokeObjectURL(url);
                    }
                }
            })
            $('#dbtable').on('init.dt', function () {
                $('#dbtable').on('click', 'tbody tr td', function () {
                    var data = table.row($(this).parent()).data();
                    // var mostRecentVersion = data[3][0];

                    console.log("data", data);

                    $(".selected").removeClass("selected");
                    $(this).parent().addClass('selected');
                    loadSceneScript(data[0], currentParams.build);
                });
            });

            // $('#dbtable').on( 'draw.dt', function () {

            //     let currentPage = $('#dbtable').DataTable().page() + 1;
            //     let hashPart = "page=" + currentPage;

            //     const currentSearch = encodeURIComponent($("#dt-search-0").val());
            //     if(currentSearch != ""){
            //         hashPart += "&search=" + currentSearch;
            //     }

            //     const columnSearches = $('#dbtable').DataTable().columns().search();
            //     for(let i = 0; i < columnSearches.length; i++){
            //         var colSearch = columnSearches[i];

            //         if(colSearch == "")
            //             continue;

            //         hashPart += "&colFilter[" + i + "]=" + encodeURIComponent(colSearch);
            //     }

            //     window.location.hash = hashPart;

            //     $('.popover').remove();

            //     $("[data-bs-toggle=popover]").popover({sanitize: false});
            // });

        },
        "dataType": "json"
    });
}

(async function () {

    hljs.configure({ languages: ['lua'] });
    await updateManifests();
    loadTable();
}());