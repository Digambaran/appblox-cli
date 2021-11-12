const {PathLike} = require('fs')
const fs = require('fs')
const path = require('path')
const {noop} = require('rxjs')

/**
 * Deletes files in a folder
 * @param {PathLike} dir Path to directory
 */
function wipeAllFilesIn(dir) {
    console.log('wiping in ', dir)
    const files = fs.readdirSync(dir)
    try {
      for (let i = 0; i < files.length; i += 1) {
        console.log('Removing ', path.join(dir, files[i]))
        fs.rmSync(path.join(dir, files[i]), { recursive: true, force: true })
      }
    } catch (e) {
      console.log('error deleting files')
    }
  }

  
/**
 * @param {PathLike} 
 * @returns {String|Number} Path string if env is found, else object with number of directories and files
 */
function isDirClean(dir) {
    // const dir = process.cwd()
    try {
      const files = fs.readdirSync(dir)
      if (files.includes('.env')) {
        return dir
      }
      return files.reduce(
        (acc, file) => {
          if (fs.statSync(path.resolve(file)).isDirectory())
            return { ...acc, dirs: acc.dirs + 1 }
          return { ...acc, files: acc.files + 1 }
        },
        { dirs: 0, files: 0 }
      )
    } catch (e) {
      if(e.code === 'ENOENT') return { dirs: 0, files: 0}
    }
    // console.log(dir);
    // console.log(process.cwd());
    // if(dir===path.parse(process.cwd()).root) return
    // if(dir===path.parse(process.cwd()).root) return
    // try {
    //   const arrayOfFiles = fs.readdirSync(dir)
    //   console.log(arrayOfFiles)
    //   isDirClean(path.join(dir,"../"))
    // } catch(e) {
    //   console.log(e)
    // }
  }

  
/**
 * Creates dir if not present
 * @param {PathLike} dir Path of directory
 * @returns
 */
function ensureDirSync(dir) {
    let stats
    try {
      stats = fs.statSync(dir)
    } catch {
      noop()
    }
    if (stats && stats.isDirectory()) return
  
    fs.mkdirSync(dir)
  }

/**
 * Creates a file in the path provided, creates parent directory if 
 * it is missing - not recursive, only one level
 * @param {String} filePath File path
 * @returns 
 */
function createFileSync(filePath) {
    let stats
    try {
      stats = fs.statSync(filePath)
    } catch {
      noop()
    }
    if (stats && stats.isFile()) return
  
    const dir = path.dirname(filePath)
    try {
      if (!fs.statSync(dir).isDirectory()) {
        // parent is not a directory
        // This is just to cause an internal ENOENT error to be thrown
        fs.readdirSync(dir)
      }
    } catch (err) {
      // If the stat call above failed because the directory doesn't exist, create it
      if (err && err.code === 'ENOENT') fs.mkdirSync(dir)
      else throw err
    }
  
    fs.writeFileSync(filePath, '')
  }

  module.exports={
      ensureDirSync,
      wipeAllFilesIn,
      createFileSync,
      isDirClean
  }