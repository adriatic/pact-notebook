# pact-host README

This is the README for your extension "pact-host". After writing up a brief description, we recommend including the following sections.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**

## Creating a PACT Notebook Workspace

PACT notebooks operate on a simple filesystem structure.  
Before running the extension, a minimal workspace must exist.

PACT expects the following directory layout inside the VSCode workspace:


notebooks/
notebook-1/
artifacts/
prompts/
responses/
proposals/


### 1. Create the notebook structure

Create the directories:

```bash
mkdir -p notebooks/notebook-1/artifacts/prompts
mkdir -p notebooks/notebook-1/artifacts/responses
mkdir -p notebooks/notebook-1/artifacts/proposals
2. Create the notebook descriptor

Create:

notebooks/notebook-1/notebook.pnb

Example content:

{
  "name": "notebook-1",
  "created": "2026-03-01T00:00:00Z"
}

This file identifies the directory as a PACT notebook.

3. Create the first prompt cell

Create a JSON file inside:

notebooks/notebook-1/artifacts/prompts/

Example:

0001.json

Content:

{
  "cell_id": "0001",
  "text": "What is the second tallest mountain in the world?",
  "timestamp": "2026-03-01T00:00:00Z"
}
4. Open the prompt in VSCode

Open the file:

notebooks/notebook-1/artifacts/prompts/0001.json

PACT Control will now display:

notebook-1
Cell 1 / 1
5. Run the cell

Press:

Run Cell

PACT will create a response artifact inside:

notebooks/notebook-1/artifacts/responses/

Each execution produces a new response file.

Summary

A minimal PACT notebook requires:

notebooks/
  notebook-1/
    notebook.pnb
    artifacts/
      prompts/
      responses/
      proposals/

Once this structure exists, PACT can execute notebook cells.