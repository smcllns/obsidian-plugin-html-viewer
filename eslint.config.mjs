import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { globalIgnores } from "eslint/config";

const obsidianRuleOverrides = Object.fromEntries(
	Object.keys(obsidianmd.rules).map((ruleName) => [`obsidianmd/${ruleName}`, "off"]),
);

export default tseslint.config(
	globalIgnores([
		"node_modules",
		"dist",
		"esbuild.config.mjs",
		"eslint.config.mjs",
		"versions.json",
		"main.js",
	]),
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ["eslint.config.mjs", "manifest.json"],
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: [".json"],
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		files: ["package.json"],
		rules: obsidianRuleOverrides,
	},
	{
		files: ["manifest.json"],
		plugins: {
			obsidianmd,
		},
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				projectService: {
					allowDefaultProject: ["manifest.json"],
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: [".json"],
			},
		},
		rules: {
			"obsidianmd/validate-manifest": "error",
		},
	},
);
