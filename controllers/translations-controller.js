const errorHandler = require('../utils/error-handler');


const getTranslationFromDeepl = async (textToTranslate, languageFrom, languageTo) => {
    //https://github.com/DeepLcom/deepl-node
    const deepl = require('deepl-node');
    const translator = new deepl.Translator(process.env.DEEPL_API_KEY);


    let translatedText = '';

    try {
        //translatedText = await translator.translateText(textToTranslate, languageFrom, languageTo, { formality: 'more' });
        translatedText = await translator.translateText(textToTranslate, languageFrom, languageTo, { formality: 'prefer_more' });
    } catch (error) {
        console.error(error);
    }


    return translatedText.text;
    /*
    const result = await translator
        .translateText('Hello, world!', null, 'fr')
        .then((result) => {
            console.log(result.text); // Bonjour, le monde !
        })
        .catch((error) => {
            console.error(error);
        });
        */
    //console.log(result.text); // Bonjour, le monde !







    /*
    try {
        logs = await log.find().sort({createdAt: -1}).limit(10);
    } catch (error) {
        return errorHandler(req, res, 'Something went wrong, could not find a logs.', 500, error);
    }

    if (!logs) {
        return errorHandler(req, res, 'Could not find logs.', 404, null);
    }

    res.json({
        logs: logs.map(log =>
            log.toObject({ getters: true })
        )
    });

    */
}


const getTranslation = async (req, res, next) => {
    const textToTranslate = req.body.textToTranslate;
    const languageFrom = req.body.languageFrom;
    const languageTo = req.body.languageTo;

    let translatedText = '';
    try {
        translatedText = await getTranslationFromDeepl(textToTranslate, languageFrom, languageTo);
    } catch (error) {
        return errorHandler(req, res, 'Something went wrong, lost connection with Deepl.', 500, error);
    }
    
    return res.json({ translatedText: translatedText });
}



exports.getTranslationFromDeepl = getTranslationFromDeepl;
exports.getTranslation = getTranslation;