///<reference path="@types/unity-package-extract/index.d.ts"/>
import {UnityExtractClient} from "unity-package-extract";
import {basename} from "path";
import {camelCase} from "lodash";
import {mkdtempSync} from "fs";
import rimraf from "rimraf";
import {dots} from "cli-spinners";
import Spinnies from "spinnies";
import {create} from "filehound";

import {appData, resolvePath} from "./path";

export const unityAssetCachePath = "Unity/Asset Store-5.x";
export const unityAssetCacheFolder = resolvePath(`${appData}/${unityAssetCachePath}`);

const unityEditorPath = resolvePath(`C:/Program Files/Unity/Hub/Editor`);
const tempDirPrefix = "unity-project-template-creator-asset-";
const client = new UnityExtractClient();

const spinnies = new Spinnies({spinner: dots, failColor: "red", succeedColor: "greenBright"});

export function findEditors() {
    return create()
        .path(unityEditorPath)
        .depth(1)
        .directory()
        .findSync();
}

export function extractAssets(paths: string[]): Promise<string[]> {
    const promises = paths.map(async (path: string): Promise<string> => {
        const filename = basename(path);
        const dir = camelCase(basename(path, ".unitypackage"));
        console.log(dir, filename);

        const tempDirFinal = mkdtempSync(`${tempDirPrefix}${dir}-`, {encoding: "utf-8"})
        const tempDirExtracted = mkdtempSync(`${tempDirPrefix}${dir}-pre-`, {encoding: "utf-8"})

        spinnies.add(filename, {text: `[${filename}] Extracting`, color: "gray"});

        const dest = await client.extract(path, tempDirExtracted);
        spinnies.update(filename, {text: `[${filename}] Converting`, color: "yellowBright"})

        const converted = await client.convert(dest, tempDirFinal);
        spinnies.update(filename, {text: `[${filename}] Extracted ${converted.length} files to ${tempDirFinal}`});
        spinnies.succeed(filename);

        await rimraf(tempDirExtracted, error => error && console.log(`Could not delete directory ${tempDirExtracted}/: ${error.message || ""}`));
        return tempDirFinal;
    });

    return Promise.all(promises);
}

export function findTemplates(editor: string) {
    return create()
        .path(resolvePath(editor))
        .ext("tar.gz")
        .findSync()
        .map(file => file.replaceAll("\\", "/"));
}

export function findUnityAssetPackages() {
    return create()
        .path(unityAssetCacheFolder)
        .ext("unitypackage")
        .findSync()
        .map(file => file.replaceAll("\\", "/"));
}
