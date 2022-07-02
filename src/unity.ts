///<reference path="@types/unity-package-extract/index.d.ts"/>
import {UnityExtractClient} from "unity-package-extract";
import {basename} from "path";
import {camelCase} from "lodash";
import {mkdtempSync} from "fs";
import {dots} from "cli-spinners";
import Spinnies from "spinnies";
import {create} from "filehound";
import {tgz} from "compressing";

import {appData, resolvePath} from "./path";
import {rmDir} from "./files";

export const unityAssetCachePath = "Unity/Asset Store-5.x";
export const unityAssetCacheFolder = resolvePath(`${appData}/${unityAssetCachePath}`);

const unityEditorPath = resolvePath(`C:/Program Files/Unity/Hub/Editor`);
const dirPrefixBase = "unity-project-template-creator";
const assetTempDirPrefix = `${dirPrefixBase}-asset`;
const templateTempDirPrefix = `${dirPrefixBase}-template`;
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
        const filename = basename(path, ".unitypackage");
        const dir = camelCase(basename(path, ".unitypackage"));

        const tempDirFinal = mkdtempSync(`${assetTempDirPrefix}-${dir}-`, {encoding: "utf-8"});
        const tempDirExtracted = mkdtempSync(`${assetTempDirPrefix}-${dir}-pre-`, {encoding: "utf-8"});

        spinnies.add(filename, {text: `[${filename}] Extracting`, color: "gray"});

        const dest = await client.extract(path, tempDirExtracted);
        spinnies.update(filename, {text: `[${filename}] Converting`, color: "yellowBright"});

        const converted = await client.convert(dest, tempDirFinal);
        spinnies.update(filename, {text: `[${filename}] Extracted ${converted.length} files to ${tempDirFinal}`});
        spinnies.succeed(filename);

        await rmDir(tempDirExtracted);
        return tempDirFinal;
    });
    return Promise.all(promises);
}

const resolveUnityProjectTemplatePath = (editor: string) => {
    return resolvePath(`${editor}/Editor/Data/Resources/PackageManager/ProjectTemplates`);
};

export function findTemplates(editor: string) {
    return create()
        .path(resolveUnityProjectTemplatePath(editor))
        .ext("tgz")
        .depth(0)
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

export async function extractTemplate(template: string) {

    try {
        const templatePath = resolvePath(template);
        const filename = basename(templatePath, ".tgz");
        const tempTemplateDir = mkdtempSync(`${templateTempDirPrefix}-${filename}`);

        await tgz.uncompress(templatePath, tempTemplateDir);
        return tempTemplateDir;
    } catch (error: any) {
        throw error;
    }
}

export async function compressTemplate(editor: string, srcTemplateDir: string, filename: string) {
    try {
        const unityTemplateDir = resolveUnityProjectTemplatePath(editor);

        await tgz.compressDir(resolvePath(`${srcTemplateDir}/package`), resolvePath(`${unityTemplateDir}/${filename}`));
        return filename;
    } catch (error: any) {
        throw error;
    }
}
