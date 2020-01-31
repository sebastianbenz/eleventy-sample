const CleanCSS = require("clean-css");
const amphtmlValidator = require('amphtml-validator');

const log = require("@ampproject/toolbox-core").log.tag('AMP Validation');
const AmpOptimizer = require("@ampproject/toolbox-optimizer");
const ampOptimizer = AmpOptimizer.create({
  markdown: true,
})

module.exports = (eleventyConfig) => {

  eleventyConfig.addShortcode("amp-twitter", (...args) => {
    let id;
    let layout = 'responsive';
    let width;
    let height;
    if (args.length < 3 || args.length > 4) {
      throw new Error('Invalid amp-twitter params');
    }
    id = args[0]
    if (args.length === 4) {
      layout = args[1];
      width = args[2];
      height = args[3];
    } else if (args.length === 3) {
      width = args[1];
      height = args[2];
    }
    return `<amp-twitter 
                layout="${layout}" 
                width="${width}" 
                height="${height}"
                data-tweetid="${id}">
      </amp-twitter>`
  })

  eleventyConfig.addShortcode("amp-video", (...args) => {
    let src;
    let layout = 'responsive';
    let width;
    let height;
    if (args.length < 3 || args.length > 4) {
      throw new Error('Invalid amp-video params');
    }
    src = args[0]
    if (args.length === 4) {
      layout = args[1];
      width = args[2];
      height = args[3];
    } else if (args.length === 3) {
      width = args[1];
      height = args[2];
    }
    return `<amp-video 
                controls
                src="${src}" 
                layout="${layout}" 
                width="${width}" 
                height="${height}"
                  ></amp-video>`
  });

  eleventyConfig.addFilter("cssmin", function(code) {
    return new CleanCSS({}).minify(code).styles;
  });

  eleventyConfig.addTransform("htmlmin", async (content, outputPath) => {
    if( outputPath.endsWith(".html") ) {
      content = await ampOptimizer.transformHtml(content, {
      });

      const validatorInstance = await amphtmlValidator.getInstance();
      const result = validatorInstance.validateString(content);
      if (result.status === 'PASS') {
        log.success(`${outputPath} [${result.status}]`);
      } else {
        log.error(`${outputPath} [${result.status}]`);
      }

      for (let ii = 0; ii < result.errors.length; ii++) {
        const error = result.errors[ii];
        let msg = `${error.severity}: ${error.message}`;
        if (error.specUrl) {
          msg += ' (see ' + error.specUrl + ')';
        }
        msg += `\n    at ${outputPath}:${error.line}:${error.col}`
        log.info(msg);
      }
    }
    return content;
  });

};
