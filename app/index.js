const Generator = require('yeoman-generator');
const os = require('os');
const fuzzy = require('fuzzy');
const {
    readdirSync,
    statSync,
    existsSync
} = require('fs')
const {
    join
} = require('path');
const process = require('process');

module.exports = class extends Generator {
    initializing() {
        this.env.adapter.promptModule.registerPrompt('checkbox-plus', require('inquirer-checkbox-plus-prompt'));
        this.env.adapter.promptModule.registerPrompt('path', require('inquirer-path').PathPrompt);
        this.getDefaultPath = platform => {
            if (process.env.APPDATA) {
                const path = process.env.APPDATA + '/hackmud';
                return existsSync(path) ? path : null;
            }

            if (platform === 'linux' && process.env.HOME) {
                const getPath = isWsl => isWsl ? 
                    `/mnt/c/Users/${process.env.USER}/AppData/Roaming/hackmud` :
                    process.env.HOME + "/.config/hackmud";
                const path = getPath(os.release().includes('Microsoft'));
                return existsSync(path) ? path : null;
            } 

            return null;
        };

        /**
         * Find all directories that are direct children of dir.
         * @function getChildren 
         * @param {string} dir Base path.
         */
        this.getChildren = dir => readdirSync(dir).filter(f => statSync(join(dir, f)).isDirectory());

        /**
         * Find all files recursively underneath root dir.
         * @function getAllFiles
         * @param {string} dir Root path to walk down.
         */
        this.getAllFiles = dir => readdirSync(dir).reduce((files, file) => {
            const name = join(dir, file);
            const isDirectory = statSync(name).isDirectory();
            return isDirectory ? [...files, ...this.getAllFiles(name)] : [...files, name];
        }, []);
    }

    async prompting() {
        this.answers = await this.prompt([
            {
                name: "name",
                message: "Enter the project name to be created:",
                default: "hackmud"
            }, {
                type: "path",
                name: "paths.hackmud",
                message: `Enter the path to your HackMud directory (case-sensitive tab complete):`,
                directoryOnly: true,
                default: this.getDefaultPath(os.platform()),
                cwd: this.getDefaultPath(os.platform()) || '/',
                filter: val => val.substr(-1) === '/' ? val.substr(0, -1) : val
            }, {
                when: res => existsSync(res.paths.hackmud),
                type: "checkbox-plus",
                name: "users",
                message: "Select users to import scripts from:",
                highlight: true,
                searchable: true,
                default: current => this.getChildren(current.paths.hackmud),
                source: (current, input) => {
                    input = input || '';
                    const children = this.getChildren(current.paths.hackmud).map(child => ({
                        name: child,
                        value: child,
                        checked: true
                    }));

                    return new Promise(resolve => {
                        const fuzzyResult = fuzzy.filter(input, children, {
                            extract: item => item.name
                        });
                        resolve(fuzzyResult.map(el => el.original));
                    });
                }
            }, {
                type: "confirm",
                name: "skipTransform",
                message: "Use ESLint plugin instead of transforming files? Not recommended, plugin is unmaintained.",
                default: false
            }
        ]);

        this.destinationRoot(this.answers.name);
    }

    configuring() {
        this.configuration = {
            "gulpConfig": {
               "paths": {
                    "hackmud": this.answers.paths.hackmud,
                    "local": this.destinationPath('src'),
                },
                "users": this.answers.users,
                "skipTransform": this.answers.skipTransform
            }
        }

        if (this.answers.skipTransform) {
            Object.assign(this.configuration, { "devDependencies": {
                "eslint": "^5.4.0",
                "eslint-plugin-hackmud": "^0.1.2"
            }});

            this.fs.extendJSON(this.destinationPath(".eslintrc"), {
                "plugins": [ "hackmud" ],
                "env": { "hackmud/hackmud": true }
            });
        }
    }

    default() {

    }

    writing() {
        const pkgJson = {
            "name": this.answers.name,
            "devDependencies": {
                "gulp": "^4.0.0",
                "gulp-clean": "^0.4.0",
                "gulp-decomment": "^0.2.0",
                "gulp-multi-dest": "^1.3.7",
                "gulp-replace": "^1.0.0",
                "lazypipe": "^1.0.1",
            },
            "scripts": {
                "gulp": "./node_modules/.bin/gulp"
            }
        };

        this.fs.extendJSON(this.destinationPath('package.json'), this.configuration);
        this.fs.extendJSON(this.destinationPath('package.json'), pkgJson);
        this.fs.copy(
            this.templatePath("gulpfile.js"),
            this.destinationPath("gulpfile.js")
        );
    }

    conflicts() {

    }

    install() {
        this.npmInstall();
    }

    end() {
        this.spawnCommand('npm', ['run', 'gulp', '--', 'import']);
    }
};