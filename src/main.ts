#!/usr/bin/env node
import clear from "clear";
import {Choice, prompt} from "prompts";
import {basename} from "path";
import {startCase} from "lodash";
import rimraf from "rimraf";

import {extractAssets, findEditors, findTemplates, findUnityAssetPackages} from "./unity";

clear();

type EditorPromptResponse = {
    editor: string
};

type PromptResponse = {
    libs: string[]
    templateName: string
};

const resolvePackageLabel = (pkg: string) => startCase(basename(pkg.replace(".unitypackage", "")));

(async () => {
    const editors = findEditors().map(editor => ({title: editor, value: editor} as Choice));
    const editorResponse: EditorPromptResponse = await prompt([
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
            choices: findTemplates(editorResponse.editor).map(template => ({title: startCase(basename(template, ".tar.gz")), value: template} as Choice)),
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
            message: "New template name:",
            type: "text"
        }
    ]);
    console.log(response);

    const newDirs = await extractAssets(response.libs);
    console.log(newDirs);

    newDirs.forEach(dir => rimraf(dir, error => error && console.log(`Could not delete directory ${dir}/: ${error.message || ""}`)));
})();


