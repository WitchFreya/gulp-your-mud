# Gulp Your (Hack)MUD

Using the power of Gulp.js and npm, streamline and accelerate your Hackmud scripting experience. 
- Watch your source files and automatically upload them to their respective Hackmud source folder auto-magically to be #up'd and used. 
- Share single scripts across all users. 
- Write valid JavaScript that can be parsed in and out of Hackmud without ESLint plugins. 
- Automatically strips comments with the exception of autocomplete helpers, to prevent accidentally using more character space with JSDoc or multiline comments!
- Choose whether or not to do file transforms based on configuration!
- Configure based on environment variables.
- Cross-platform support.

## Installation
1. Install Yo if you do not currently have it: `npm i -g yo`
2. Install the generator: `npm i -g generator-gulp-your-mud`
3. Navigate to the parent directory of where you want to keep your projects (e.g. if you want a project to be `~/Documents/hackmud`, run `cd ~/Documents`)
4. Create a new project: `yo gulp-your-mud`.
5. Configure.
6. cd in and start watching! ``npm run gulp``

## Usage
- ``npm run gulp [-- <task(s)>]``: Run any of the Gulp tasks. You can also use ``gulp`` regularly if you have it installed globally. See below for tasks.
- Move a file from a ``src/[username]`` folder to ``src/`` and it will copy to all of your users.

## Gulp Tasks
- ``default``: ``watch``.
- ``watch``: Place a watch on all ``.js`` files underneath of the ``src`` directory. Whenever any of them are saved, they will immediately update to your remote Hackmud folder. 
- ``build:local``: As an optional build measure, this will output all files into ``./build`` after processing them. This can sometimes help with debugging by line number.
- ``clean``: Delete everything from your Hackmud remote directory, and from the ``./build`` directory if it exists. **Use with caution.** 
    - ``clean:local``: Clean everything in the ``./build`` directory if it exists.
- ``import``: Retrieve all files from the remote Hackmud directory and transforms them (Respects the ``doTransform`` configuration option).
- More: Check ``gulpfile.js`` if you want to look at the other tasks.

## Configuration

- Modify the ``gulpConfig`` portion of your ``package.json``. 
- Set via Node environment variables if needed (format is ``MUD_VARIABLE_NAME``, space-delimeted strings for arrays).
- Add another user to the array to track a folder by the same name in the ``src`` directory.
- Modify the paths to change where Gulp looks for files.

## Like it?

``accts.xfer_gc_to { to: "freya", memo: "Gulp changed my life. Where would I be without Gulp?", amount: $$$ }``

