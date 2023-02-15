module.exports = {
    sendResponseWithPagination: (responseObj, responseCode, responseMessage, data, paginationData) => {
        return responseObj.send({ 'responseCode': responseCode, 'responseMessage': responseMessage, result: data, paginationData: paginationData })
    },
    sendResponseWithData: (responseObj, responseCode, responseMessage, data) => {
        return responseObj.send({ 'responseCode': responseCode, 'responseMessage': responseMessage, result: data});
    },
    sendResponseWithoutData: (responseObj, responseCode, responseMessage) => {
        return responseObj.send({ 'responseCode': responseCode, 'responseMessage': responseMessage });
    },
    sendResponsewithError: (responseObj, responseCode, responseMessage, Err) => {
        return responseObj.send({ responseCode: responseCode, responseMessage: responseMessage, Err: Err })
    },
    sendResponseWithToken: (responseObj, responseCode, responseMessage, tokn) => {
        return responseObj.send({ 'responseCode': responseCode, 'responseMessage': responseMessage, token: tokn });
    },
    sendResponseWithTokenAndResult: (responseObj, responseCode, responseMessage, result, tokn) => {
        return responseObj.send({ 'responseCode': responseCode, 'responseMessage': responseMessage, "result": result, token: tokn });
    },

};