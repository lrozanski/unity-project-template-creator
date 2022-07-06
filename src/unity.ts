///<reference path="@types/unity-package-extract/index.d.ts"/>
import {dots} from "cli-spinners";
import {tgz} from "compressing";
import {create} from "filehound";
import {mkdirSync, mkdtempSync, readFileSync, writeFileSync} from "fs";
import {copySync} from "fs-extra";
import {camelCase, entries} from "lodash";
import {basename, join} from "path";
import Spinnies from "spinnies";
import {UnityExtractClient} from "unity-package-extract";

import {rmDir} from "./files";
import {appData, resolvePath} from "./path";

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

export const getPackageFileLocation = (templateDir: string) => join(templateDir, "package", "package.json");

export function parsePackageFile(templateDir: string): Unity.Package {
    const file = readFileSync(getPackageFileLocation(templateDir), {encoding: "utf-8"});

    return JSON.parse(file) as Unity.Package;
}

export function writePackageFile(templateDir: string, packageFile: Unity.Package) {
    writeFileSync(getPackageFileLocation(templateDir), JSON.stringify(packageFile, null, 2), {encoding: "utf-8"});
}

export function filterOutDependencies(packageFile: Unity.Package, dependencies: string[]): Record<string, string> {
    const existingDependencies = entries(packageFile.dependencies)
        .filter(entry => !dependencies.includes(entry[0]));

    return Object.fromEntries(existingDependencies);
}

export const getProjectDataLocation = (templateDir: string) => join(templateDir, "package", "ProjectData~");

export function copyTempAssets(templateDir: string, paths: string[]) {
    const projectDataLocation = getProjectDataLocation(templateDir);

    paths.forEach(assetPath => copySync(assetPath, projectDataLocation, {overwrite: true, recursive: true}));
}
