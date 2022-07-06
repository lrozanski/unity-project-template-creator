#!/usr/bin/env node
///<reference path="@types/global/index.d.ts"/>
import clear from "clear";
import {startCase} from "lodash";
import {basename} from "path";
import {Choice, prompt} from "prompts";

import {rmDir} from "./files";
import {
    compressTemplate,
    copyTempAssets,
    createDefaultAssetDirs,
    extractAssets,
    extractTemplate,
    filterOutDependencies,
    findEditors,
    findTemplates,
    findUnityAssetPackages,
    parsePackageFile,
    writePackageFile
} from "./unity";

clear();

type EditorPromptResponse = {
    editor: string
};

type PromptResponse = {
    libs: string[]
    templateBase: string
    templateName: string
    templateVersion: string
};

const resolvePackageLabel = (pkg: string) => startCase(basename(pkg.replace(".unitypackage", "")));
const resolveTemplateName = (name: string, version: string) => `${name}-${version}.tgz`;

(async () => {
    const editors = findEditors().map(editor => ({title: basename(editor), value: editor} as Choice));
    const {editor}: EditorPromptResponse = await prompt([
        {
            name: "editor",
            message: "Select Editor version:",
            choices: editors,
            type: "select"
        }
    ]);

    const libs: Choice[] = findUnityAssetPackages().map(pkg => ({
        title: resolvePackageLabel(pkg),
        value: pkg
    }));
    const response: PromptResponse = await prompt([
        {
            name: "templateBase",
            message: "Choose template to use as base:",
            choices: findTemplates(editor).map(template => ({title: basename(template, ".tgz"), value: template} as Choice)),
            type: "select"
        },
        {
            name: "libs",
            message: "Select libraries:",
            choices: libs,
            type: "multiselect"
        },
        {
            name: "templateName",
            message: "New template name (without version):",
            type: "text"
        },
        {
            name: "templateVersion",
            message: "New template version (eg. 1.0.0):",
            type: "text"
        }
    ]);
    console.log();
    const tempAssetDirs = await extractAssets(response.libs);
    const tempTemplateDir = await extractTemplate(response.templateBase);

    const packageFile = parsePackageFile(tempTemplateDir);
    packageFile.name = response.templateName;
    packageFile.displayName = response.templateName;
    packageFile.version = response.templateVersion;
    packageFile.dependencies = filterOutDependencies(packageFile, [
        "com.unity.collab-proxy",
        "com.unity.ide.visualstudio",
        "com.unity.ide.vscode",
    ]);

    writePackageFile(tempTemplateDir, packageFile);
    createDefaultAssetDirs(tempTemplateDir);
    copyTempAssets(tempTemplateDir, tempAssetDirs);

    const newTemplateName = resolveTemplateName(response.templateName, response.templateVersion);
    const compressedTemplate = await compressTemplate(editor, tempTemplateDir, newTemplateName);

    tempAssetDirs.forEach(rmDir);
    rmDir(tempTemplateDir);
    console.log();
})();


