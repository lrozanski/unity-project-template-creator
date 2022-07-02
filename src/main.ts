#!/usr/bin/env node
import clear from "clear";
import {Choice, prompt} from "prompts";
import {basename} from "path";
import {startCase} from "lodash";
import rimraf from "rimraf";

import {compressTemplate, extractAssets, extractTemplate, findEditors, findTemplates, findUnityAssetPackages} from "./unity";
import {rmDir} from "./files";

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
    const newTemplateName = resolveTemplateName(response.templateName, response.templateVersion);
    const compressedTemplate = await compressTemplate(editor, tempTemplateDir, newTemplateName);

    tempAssetDirs.forEach(rmDir);
    rmDir(tempTemplateDir);
    console.log();
})();


