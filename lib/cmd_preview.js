let express = require('express')
let serveStatic = require('serve-static')
let path = require('path')
let MarkdownIt = require('markdown-it')
let fs = require('fs')
let swig = require('swig')
swig.setDefaults({cache: false})
let md = new MarkdownIt({
  html: true,
  langPrefix: 'code-'
})

module.exports = function (dir) {
  dir = dir || '.'
  let app = express()
  let router = express.Router()
  app.use('/assets', serveStatic(path.resolve(dir, 'assets')))
  app.use(router)

  router.get('/posts/*', function (req, res, next) {
    let name = stripExtname(req.params[0])
    let file = path.resolve(dir, '_posts', name + '.md')
    fs.readFile(file, function (err, content) {
      if (err) return next(err)
      let post = parseSourceContent(content.toString())
      post.content = markdownToHTML(post.source)
      post.layout = post.layout || 'post'
      let html = renderFile(path.resolve(dir, '_layout', post.layout + '.html'), {post: post})
      res.end(html)
    })
  })

  router.get('/', function (req, res, next) {
    res.end('文章列表')
  })

  app.listen(3000)
}

function stripExtname (name) {
  let i = 0 - path.extname(name).length
  if (i === 0) i = name.length
  return name.slice(0, i)
}

function markdownToHTML (content) {
  return md.render(content || '')
}

function parseSourceContent (data) {
  let split = '---\n'
  let i = data.indexOf(split)
  let info = {}
  if (i !== -1) {
    let j = data.indexOf(split, i + split.length)
    if (j !== -1) {
      let str = data.slice(i + split.length, j).trim()
      data = data.slice(j + split.length)
      str.split('\n').forEach(function (line) {
        let i = line.indexOf(':')
        if (i !== -1) {
          let name = line.slice(0, i).trim()
          let value = line.slice(i + 1).trim()
          info[name] = value
        }
      })
    }
  }
  info.source = data
  return info
}

function renderFile (file, data) {
  return swig.render(fs.readFileSync(file).toString(), {
    filename: file,
    autoescape: false,
    locals: data
  })
}
