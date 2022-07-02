#!/usr/bin/env node
///<reference path="@types/unity-package-extract/index.d.ts"/>
import isWsl from "is-wsl";
import clear from "clear";
import {create} from "filehound";
import {Choice, prompts} from "prompts";
import {basename} from "path";
import {startCase} from "lodash";
import {extractAssets} from "./unity";

clear();

const drivePath = isWsl ? "/mnt/c/" : "C:/";
const rawPath = "Users/lroza/AppData/Roaming/Unity/Asset Store-5.x";
const unityAssetCacheFolder = `${drivePath}${rawPath}`;

function findUnityAssetPackages() {
    return create()
        .path(unityAssetCacheFolder)
        .ext("unitypackage")
        .findSync()
        .map(file => file.replaceAll("\\", "/"));
}

const unityAssetPackages = findUnityAssetPackages();

const libs: Choice[] = unityAssetPackages.map(pkg => {
    return {
        title: startCase(basename(pkg.replace(".unitypackage", ""))),
        value: pkg,
        selected: false
    } as Choice;
});

(async () => {
    const selectedLibs = await prompts.multiselect({
        name: "test",
        message: "Select libraries:",
        choices: libs,
        type: "multiselect"
    }) as string[]

    const newDirs = await extractAssets(selectedLibs);
    console.log(newDirs);
})();


