let nodemailer = require("nodemailer"),
    config = require("./config").config,
    templates = require("./templates"),
    MD5 = require('md5'),
    request = require('request'),
    mustache = require('mustache'),
    bodyParser = require('body-parser'),
    parseString = require('xml2js').parseString;
var querystring = require('querystring');
//let cityDetail = require('../Utilities/cityDetail.json');



let htmlEnDeCode = (function() {
    var charToEntityRegex,
        entityToCharRegex,
        charToEntity,
        entityToChar;

    function resetCharacterEntities() {
        charToEntity = {};
        entityToChar = {};
        // add the default set
        addCharacterEntities({
            '&amp;': '&',
            '&gt;': '>',
            '&lt;': '<',
            '&quot;': '"',
            '&#39;': "'"
        });
    }

    function addCharacterEntities(newEntities) {
        var charKeys = [],
            entityKeys = [],
            key, echar;
        for (key in newEntities) {
            echar = newEntities[key];
            entityToChar[key] = echar;
            charToEntity[echar] = key;
            charKeys.push(echar);
            entityKeys.push(key);
        }
        charToEntityRegex = new RegExp('(' + charKeys.join('|') + ')', 'g');
        entityToCharRegex = new RegExp('(' + entityKeys.join('|') + '|&#[0-9]{1,5};' + ')', 'g');
    }

    function htmlEncode(value) {
        var htmlEncodeReplaceFn = function(match, capture) {
            return charToEntity[capture];
        };

        return (!value) ? value : String(value).replace(charToEntityRegex, htmlEncodeReplaceFn);
    }

    function htmlDecode(value) {
        var htmlDecodeReplaceFn = function(match, capture) {
            return (capture in entityToChar) ? entityToChar[capture] : String.fromCharCode(parseInt(capture.substr(2), 10));
        };

        return (!value) ? value : String(value).replace(entityToCharRegex, htmlDecodeReplaceFn);
    }

    resetCharacterEntities();

    return {
        htmlEncode: htmlEncode,
        htmlDecode: htmlDecode
    };
})();

// Define Error Codes
let statusCode = {
    EVERYTHING_IS_OK: 200,

    OUT_OF_STOCK: 300,

    NEW_RESOURCE_CREATED: 201,

    RESOURCE_DELETED: 204,

    NOT_MODIFIED: 304,

    BAD_REQUEST: 400,

    PARAMETER_IS_MISSING: 401,

    FORBIDDEN: 403,

    NOT_FOUND: 404,

    ALREADY_EXIST: 409,

    INTERNAL_SERVER_ERROR: 500,

    WENT_WRONG: 501,

    DUPLICATE_REGNO: 502,

    SOMETHING_WENT_WRONG: 503
};

let statusMessage = {
    REGISTRATION_DONE: {
        en: "Registration has been done successfully",
        ar: "التسجيل تم"
    },
    BOOKED_ACTIVITY: {
        en: "Activity Booked",
        ar: "التسجيل تم"
    },
    ALREADY_BOOKED: {
        en: "Activity Already Booked",
        ar: "التسجيل تم"
    },
    ACTIVITY_GIFTED: {
        en: "Activity Gifted",
        ar: "التسجيل تم"
    },
    ALREADY_GIFT: {
        en: "Activity Already Gifted",
        ar: "التسجيل تم"
    },

    DELETE_BY_ADMIN: {
        en: "You are deactivated from admin",
        ar: "التسجيل تم"
    },
   

    CREATE_ACTIIVITY: {
        en: "Activity has been created successfully",
        ar: "التسجيل تم"
    },

    BUSINESS_DETAILS_ADDEDD: {
        en: "Business detail has been added successfully",
        ar: "Business detail has been added successfully"
    },
    PAYMENT_DONE: {
        en: "Payment successful",
        ar: "التسجيل تم"
    },
    LOGGED_IN: {
        en: "You have successfully logged in",
        ar: "لقد نجحت في تسجيل الدخول"
    },
    COMPLETE: {
        en: "Complete your profile",
        ar: "أكمل ملفك الشخصي"
    },
    PARAMS_MISSING: {
        en: "Mandatory fields are missing",
        ar: "الحقول الإلزامية مفقودة"
    },
    SERVER_BUSY: {
        en: "Failed to connect to the server . Please try again later.",
        ar: "فشل الاتصال بالخادم . الرجاء معاودة المحاولة في وقت لاحق."
    },
    INCORRECT_OLD_PASSWORD: {
        en: "Old password is Incorrect",
        ar: "كلمة سر قديمة ليست صحيحة"
    },
    USER_BLOCK: {
        en: "Blocked by admin",
        ar: "كلمة سر قديمة ليست صحيحة"
    },
    PASSWORD_UPDATED: {
        en: "Your password has been updated successfully.",
        ar: "تم تحديث كلمة المرور الخاصة بك بنجاح"
    },

    PASSWORD_CHANGED: {
        en: "Your password has been changed successfully.",
        ar: "تم تغيير كلمة المرور الخاصة بك بنجاح."
    },
    LOGOUT: {
        en: "Logged in another device",
        ar: "لقد خرجت الآن."
    },
    PAGE_NOT_FOUND: {
        en: "Page not found",
        ar: "الصفحة غير موجودة"
    },
    USER_NOT_FOUND: {
        en: "User not found ",
        ar: "المستخدم ليس موجود"
    },
    DB_ERROR: {
        en: "Database related error occured",
        ar: "حدث خطأ متعلق بقاعدة البيانات"
    },
    EMAIL_NOT_REGISTERED: {
        en: "Email id is not registered",
        ar: "معرف البريد الإلكتروني غير مسجل"
    },
    GOT_AUDIO_LIST: {
        en: "Got audio list Successfully",
        ar: "حصلت على قائمة الصوت بنجاح"
    },
    OTP: {
        en: "Otp has been sent Successfully.",
        ar: "أرسلت Otp بنجاح."
    },
    SOMETHING_WENT_WRONG: {
        en: "Something went wrong.",
        ar: "هناك خطأ ما."
    },
    FETCHED_SUCCESSFULLY: {
        en: "Fetched Data Successfully.",
        ar: "جلب البيانات بنجاح."
    },
    UPLOAD_SUCCESSFUL: {
        en: "Image has been uploaded Successfully.",
        ar: "تم تحميل الصورة بنجاح."
    },
    USER_ADDED: {
        en: "User has been added Successfully.",
        ar: "تم إنشاء المستخدم بنجاح."
    },
    STATUS_UPDATED: {
        en: "Status updated successfully.",
        ar: "تم تحديث الحالة بنجاح."
    },
    DEVICE_tOKEN_UPDATE: {
        en: "Device token updated successfully.",
        ar: "تحديث الرمز المميز للجهاز بنجاح."
    },
    LOGIN_SUCCESS: {
        en: "You have successfully login.",
        ar: "أنت تسجل الدخول بنجاح."
    },
    USER_EXISTS: {
        en: "User already exists for provided email.",
        ar: "المستخدم موجود بالفعل للبريد الإلكتروني المقدم."
    },
    INCORRECT_CREDENTIALS: {
        en: "Incorrect email or password.",
        ar: "بريد أو كلمة مرورغير صحيحة."
    },
    INCORRECT_EMAIL: {
        en: "Please enter correct email.",
        ar: "يرجى إدخال البريد الإلكتروني الصحيح."
    },
    EMAIL_SENT: {
        en: "An email with login credentials has been sent to your registered email id",
        ar: "تم إرسال بريد إلكتروني مع رابط لإعادة تعيين كلمة المرور إلى معرف البريد الإلكتروني المسجل"
    },
    INVALID_TOKEN: {
        en: "User Authentication Failed.",
        ar: "فشلت مصادقة المستخدم."
    },
    GET_DATA: {
        en: "User data fetch successfully.",
        ar: "جلب بيانات المستخدم بنجاح."
    },
    ADDRESS_ADD: {
        en: "Address has been added successfully.",
        ar: "تمت إضافة العنوان بنجاح."
    },
    NOT_UPDATE: {
        en: "Data has been not Uploaded",
        ar: "البيانات غير تحميل"
    },
    categoriesList_found: {
        en: "Categories List is found",
        ar: "تم العثور على قائمة الفئات"
    },
    ADD_PRODUCT: {
        en: "PRODUCT has been added SUCCESSFULLY",
        ar: ""
    },
    PAYMENT_ADD: {
        en: "Payment method has been added successfully.",
        ar: "طريقة الدفع تضاف بنجاح."
    },
    USER_FOUND: {
        en: "User found Successfully",
        ar: "تم العثور على المستخدم بنجاح"
    },
    HOMESCREEN_API: {
        en: "Home Screen Data",
        ar: "بيانات الشاشة الرئيسية"
    },
    CATEGORY_ADDED: {
        en: "Category has been added successfully",
        ar: "إضافة فئة بنجاح"
    },
    OFFERS_ADDED: {
        en: "Offers has been added successfully",
        ar: "أضف العروض بنجاح"
    },
    ALREADY_EXIST: {
        en: "ALREADY EXIST",
        ar: "موجود مسبقا"
    },

    OFFER_ALREADY_EXIST: {
        en: "This is Offer already exist",
        ar: "موجود مسبقا"
    },
    ADD_TO_CART: {
        en: "Product has been Added to cart",
        ar: "وأضاف المنتج بنجاح"
    },
    list_of_Cart: {
        en: "List of Bag",
        ar: "قائمة الحقيبة"
    },
    getAddressSuccessfully: {
        en: "Get Address Successfully",
        ar: "الحصول على العنوان بنجاح"
    },
    GET_PAYMENT_LIST: {
        en: "Get PaymentList Successfully",
        ar: "الحصول على العنوان بنجاح"
    },
    ADD_TO_WISHLIST: {
        en: "Product has been added to Wishlist",
        ar: "المنتج أضيف إلى قائمة الأمنيات"
    },
    LIST_EMPTY: {
        en: "Your Cart is Empty",
        ar: "عربة التسوق فارغة"
    },
    WISHLIST_EMPTY: {
        en: "Your WishList is Empty",
        ar: "عربة التسوق فارغة"
    },
    WISHLIST_PRODUCT_ALREADY_EXIST: {
        en: "Product has been already added to your Wishlist",
        ar: "المنتج موجود بالفعل في قائمة الامنيات الخاصة بك"
    },
    PRODUCT_DELETE_WISHLIST: {
        en: "Product has been deleted from your WishList",
        ar: "تم حذف المنتج في قائمة رغباتك"
    },
    list_of_wishList: {
        en: "List of wishlist",
        ar: "قائمة الأماني"

    },
    CART_PRODUCT_ALREADY_EXIST: {
        en: "Product already exists in your Wishlist",
        ar: "المنتج موجود في قائمة الامنيات الخاصة بك"
    },
    PRODUCT_DELETE_CART: {
        en: "Product has been removed from your bag",
        ar: "تم حذف المنتج من حقيبتك"
    },
    PRODUCT_NOT_FOUND: {
        en: "Product not found",
        ar: "الصنف غير موجود"
    },
    PRODUCT_FOUND: {
        en: "Product found successfully",
        ar: "تم العثور على المنتج بنجاح"
    },
    ORDER_PLACED: {
        en: "Order has been Placed Successfully",
        ar: "أجل وضعت بنجاح"
    },
    LIST_ORDER: {
        en: "List of orders",
        ar: "قائمة الطلب"
    },
    ORDER_EMPTY: {
        en: "Your Order is Empty",
        ar: "طلبك فارغ"
    },
    SUBCATORY_FOUND: {
        en: "SubCategory of product",
        ar: "فئة فرعية من المنتج"
    },
    NOT_FOUND: {
        en: "NOT FOUND",
        ar: "غير معثور عليه"
    },
    ADD_PHYSICALSTORE: {
        en: "Physical store has been added successfully",
        ar: "تمت إضافة المتجر الفعلي بنجاح"
    },
    FILTER_LIST: {
        en: "Filter List",
        ar: "قائمة تصفية"
    },
    NOW_PRODUCT_AVAILABLE: {
        en: "No Product Available for this filter",
        ar: "لا يوجد منتج متاح لهذا المرشح"
    },
    Review_saved_successfully: {
        "en": "Review has been saved successfully",
        "ar": "تم حفظ التقييم بنجاح"
    },
    InvalidPhoneNuber: {
        en: "Invaild phone Number",
        ar: "فشل الاتصال بالخادم . الرجاء معاودة المحاولة في وقت لاحق."
    },
    BAG_PRODUCT_ALREADY_EXIST: {
        en: "Product has been already added to your BAG",
        ar: "المنتج موجود بالفعل في الحزمة الخاصة بك"
    },
    USER_LOGIN_SOCIAL: {
        en: "This Email is registerd with social login. You can't reset the password for this email.",
        ar: "تسجيل دخول المستخدم من خلال وسائل التواصل الاجتماعي"
    },
    DELETE_VENDOR: {
        en: "Vendor has been deleted",
        ar: ""
    },
    BLOCK_VENDOR: {
        en: "Vendor has been blocked",
        ar: ""
    },
    ACTIVE_VENDOR: {
        en: "Vendor has been activated",
        ar: ""
    },
    COMPARE_SCREEN: {
        en: "Comparsion of Screen",
        ar: ""
    },
    NOTIFICATION_SCREEN: {
        en: "Notification Screen",
        ar: ""
    },
    PROFILE_UPDATE: {
        en: "Profile details has been Uploaded",
        ar: ""
    },
    BUSINESS_UPDATE_SUCESS: {
        en: "Business details has been Uploaded",
        ar: ""
    },
    EDIT_PAYMENT: {
        en: "Your payment card update",
        ar: ""
    },
    DELET_PAYMENT: {
        en: "Your card has been removed",
        ar: ""
    },
    DELETE_ADDRESS_SUCCESS: {
        en: "your address has been deleted",
        ar: "your address is deleted"
    },
    OUT_OF_STOCK: {
        en: "Some items are not in stock. Please remove it before checkout",
        ar: "Some items are not in stock please remove it before checkout"
    },
    IMPORT_PRODUCT_SUCCESSS: {
        en: "Import product successfully",
        ar: "Import product successfully"
    },
    TITLE: {

        PLACED: {
            en: 'Order has been Placed',
            ar: ''
        },
        DELIVERIED: {
            en: 'Order has been Deliveried',
            ar: ''
        },
        REJECTED: {
            en: 'Order has been Rejected',
            ar: ''
        },
        CANCELLED: {
            en: 'Order has been Cancelled',
            ar: ''
        },
        DISPATCH: {
            en: 'Order has been Dispatched',
            ar: ''
        },
        INACTIVE: {
            en: 'INACTIVE',
            ar: ''
        }
    },
    type: {
        PLACED: {
            en: 'PLACED',
            ar: ''
        },
        DELIVERIED: {
            en: 'DELIVERIED',
            ar: ''
        },
        RREJECTED: {
            en: 'ORDER REJECTED',
            ar: ''
        },
        CANCELLED: {
            en: 'CANCELLED',
            ar: ''
        },
        DISPATCH: {
            en: 'DISPATCHED',
            ar: ''
        },
        INACTIVE: {
            en: 'INACTIVE',
            ar: ''
        }
    },
    notifyMsg: {

        PLACED: {
            en: 'Your Order has been Placed',
            ar: ''
        },
        DELIVERIED: {
            en: 'Your Order has been DELIVERIED',
            ar: ''
        },
        RREJECTED: {
            en: 'Your Order ORDER has been REJECTED',
            ar: ''
        },
        CANCELLED: {
            en: 'Your Order has been CANCELLED',
            ar: ''
        },
        DISPATCH: {
            en: 'Your Order has been DISPATCHED',
            ar: ''
        },
        INACTIVE: {
            en: 'Your Order is INACTIVE',
            ar: ''
        }
    }
};
// // Define Error Messages
// let statusMessage = {
//     REGISTRATION_DONE: {
//         en: "Registration has been done successfully",
//         ar: "التسجيل تم"
//     },
//     BUSINESS_DETAILS_ADDEDD: {
//         en: "Business detail has been added successfully",
//         ar: "Business detail has been added successfully"
//     },
//     PAYMENT_DONE: {
//         en: "Payment successful",
//         ar: "التسجيل تم"
//     },
//     LOGGED_IN: {
//         en: "You have successfully logged in",
//         ar: "لقد نجحت في تسجيل الدخول"
//     },
//     COMPLETE: {
//         en: "Complete your profile",
//         ar: "أكمل ملفك الشخصي"
//     },
//     PARAMS_MISSING: {
//         en: "Mandatory fields are missing",
//         ar: "الحقول الإلزامية مفقودة"
//     },
//     SERVER_BUSY: {
//         en: "Failed to connect to the server . Please try again later.",
//         ar: "فشل الاتصال بالخادم . الرجاء معاودة المحاولة في وقت لاحق."
//     },
//     INCORRECT_OLD_PASSWORD: {
//         en: "Old password is Incorrect",
//         ar: "كلمة سر قديمة ليست صحيحة"
//     },
//     USER_BLOCK: {
//         en: "Blocked by admin",
//         ar: "كلمة سر قديمة ليست صحيحة"
//     },
//     PASSWORD_UPDATED: {
//         en: "Your password has been updated successfully.",
//         ar: "تم تحديث كلمة المرور الخاصة بك بنجاح"
//     },

//     PASSWORD_CHANGED: {
//         en: "Your password has been changed successfully.",
//         ar: "تم تغيير كلمة المرور الخاصة بك بنجاح."
//     },
//     LOGOUT: {
//         en: "You are signed out.",
//         ar: "لقد خرجت الآن."
//     },
//     PAGE_NOT_FOUND: {
//         en: "Page not found",
//         ar: "الصفحة غير موجودة"
//     },
//     USER_NOT_FOUND: {
//         en: "User not found ",
//         ar: "المستخدم ليس موجود"
//     },
//     DB_ERROR: {
//         en: "Database related error occured",
//         ar: "حدث خطأ متعلق بقاعدة البيانات"
//     },
//     EMAIL_NOT_REGISTERED: {
//         en: "Email id is not registered",
//         ar: "معرف البريد الإلكتروني غير مسجل"
//     },
//     GOT_AUDIO_LIST: {
//         en: "Got audio list Successfully",
//         ar: "حصلت على قائمة الصوت بنجاح"
//     },
//     OTP: {
//         en: "Otp has been sent Successfully.",
//         ar: "أرسلت Otp بنجاح."
//     },
//     SOMETHING_WENT_WRONG: {
//         en: "Something went wrong.",
//         ar: "هناك خطأ ما."
//     },
//     FETCHED_SUCCESSFULLY: {
//         en: "Fetched Data Successfully.",
//         ar: "جلب البيانات بنجاح."
//     },
//     UPLOAD_SUCCESSFUL: {
//         en: "Image has been uploaded Successfully.",
//         ar: "تم تحميل الصورة بنجاح."
//     },
//     USER_ADDED: {
//         en: "User has been added Successfully.",
//         ar: "تم إنشاء المستخدم بنجاح."
//     },
//     STATUS_UPDATED: {
//         en: "Status updated successfully.",
//         ar: "تم تحديث الحالة بنجاح."
//     },
//     DEVICE_tOKEN_UPDATE: {
//         en: "Device token updated successfully.",
//         ar: "تحديث الرمز المميز للجهاز بنجاح."
//     },
//     LOGIN_SUCCESS: {
//         en: "You have successfully login.",
//         ar: "أنت تسجل الدخول بنجاح."
//     },
//     USER_EXISTS: {
//         en: "User already exists for provided email.",
//         ar: "المستخدم موجود بالفعل للبريد الإلكتروني المقدم."
//     },
//     INCORRECT_CREDENTIALS: {
//         en: "Incorrect email or password.",
//         ar: "بريد أو كلمة مرورغير صحيحة."
//     },
//     INCORRECT_EMAIL: {
//         en: "Please enter correct email.",
//         ar: "يرجى إدخال البريد الإلكتروني الصحيح."
//     },
//     EMAIL_SENT: {
//         en: "An email with login credentials has been sent to your registered email id",
//         ar: "تم إرسال بريد إلكتروني مع رابط لإعادة تعيين كلمة المرور إلى معرف البريد الإلكتروني المسجل"
//     },
//     INVALID_TOKEN: {
//         en: "User Authentication Failed.",
//         ar: "فشلت مصادقة المستخدم."
//     },
//     GET_DATA: {
//         en: "User data fetch successfully.",
//         ar: "جلب بيانات المستخدم بنجاح."
//     },
//     ADDRESS_ADD: {
//         en: "Address has been added successfully.",
//         ar: "تمت إضافة العنوان بنجاح."
//     },
//     NOT_UPDATE: {
//         en: "Data has been not Uploaded",
//         ar: "البيانات غير تحميل"
//     },
//     categoriesList_found: {
//         en: "Categories List is found",
//         ar: "تم العثور على قائمة الفئات"
//     },
//     ADD_PRODUCT: {
//         en: "PRODUCT has been added SUCCESSFULLY",
//         ar: ""
//     },
//     PAYMENT_ADD: {
//         en: "Payment method has been added successfully.",
//         ar: "طريقة الدفع تضاف بنجاح."
//     },
//     USER_FOUND: {
//         en: "User found Successfully",
//         ar: "تم العثور على المستخدم بنجاح"
//     },
//     HOMESCREEN_API: {
//         en: "Home Screen Data",
//         ar: "بيانات الشاشة الرئيسية"
//     },
//     CATEGORY_ADDED: {
//         en: "Category has been added successfully",
//         ar: "إضافة فئة بنجاح"
//     },
//     OFFERS_ADDED: {
//         en: "Offers has been added successfully",
//         ar: "أضف العروض بنجاح"
//     },
//     ALREADY_EXIST: {
//         en: "ALREADY EXIST",
//         ar: "موجود مسبقا"
//     },

//     OFFER_ALREADY_EXIST: {
//         en: "This is Offer already exist",
//         ar: "موجود مسبقا"
//     },
//     ADD_TO_CART: {
//         en: "Product has been Added to cart",
//         ar: "وأضاف المنتج بنجاح"
//     },
//     list_of_Cart: {
//         en: "List of Bag",
//         ar: "قائمة الحقيبة"
//     },
//     getAddressSuccessfully: {
//         en: "Get Address Successfully",
//         ar: "الحصول على العنوان بنجاح"
//     },
//     GET_PAYMENT_LIST: {
//         en: "Get PaymentList Successfully",
//         ar: "الحصول على العنوان بنجاح"
//     },
//     ADD_TO_WISHLIST: {
//         en: "Product has been added to Wishlist",
//         ar: "المنتج أضيف إلى قائمة الأمنيات"
//     },
//     LIST_EMPTY: {
//         en: "Your Cart is Empty",
//         ar: "عربة التسوق فارغة"
//     },
//     WISHLIST_EMPTY: {
//         en: "Your WishList is Empty",
//         ar: "عربة التسوق فارغة"
//     },
//     WISHLIST_PRODUCT_ALREADY_EXIST: {
//         en: "Product has been already added to your Wishlist",
//         ar: "المنتج موجود بالفعل في قائمة الامنيات الخاصة بك"
//     },
//     PRODUCT_DELETE_WISHLIST: {
//         en: "Product has been deleted from your WishList",
//         ar: "تم حذف المنتج في قائمة رغباتك"
//     },
//     list_of_wishList: {
//         en: "List of wishlist",
//         ar: "قائمة الأماني"

//     },
//     CART_PRODUCT_ALREADY_EXIST: {
//         en: "Product already exists in your Wishlist",
//         ar: "المنتج موجود في قائمة الامنيات الخاصة بك"
//     },
//     PRODUCT_DELETE_CART: {
//         en: "Product has been removed from your bag",
//         ar: "تم حذف المنتج من حقيبتك"
//     },
//     PRODUCT_NOT_FOUND: {
//         en: "Product not found",
//         ar: "الصنف غير موجود"
//     },
//     PRODUCT_FOUND: {
//         en: "Product found successfully",
//         ar: "تم العثور على المنتج بنجاح"
//     },
//     ORDER_PLACED: {
//         en: "Order has been Placed Successfully",
//         ar: "أجل وضعت بنجاح"
//     },
//     LIST_ORDER: {
//         en: "List of orders",
//         ar: "قائمة الطلب"
//     },
//     ORDER_EMPTY: {
//         en: "Your Order is Empty",
//         ar: "طلبك فارغ"
//     },
//     SUBCATORY_FOUND: {
//         en: "SubCategory of product",
//         ar: "فئة فرعية من المنتج"
//     },
//     NOT_FOUND: {
//         en: "NOT FOUND",
//         ar: "غير معثور عليه"
//     },
//     ADD_PHYSICALSTORE: {
//         en: "Physical store has been added successfully",
//         ar: "تمت إضافة المتجر الفعلي بنجاح"
//     },
//     FILTER_LIST: {
//         en: "Filter List",
//         ar: "قائمة تصفية"
//     },
//     NOW_PRODUCT_AVAILABLE: {
//         en: "No Product Available for this filter",
//         ar: "لا يوجد منتج متاح لهذا المرشح"
//     },
//     Review_saved_successfully: {
//         "en": "Review has been saved successfully",
//         "ar": "تم حفظ التقييم بنجاح"
//     },
//     InvalidPhoneNuber: {
//         en: "Invaild phone Number",
//         ar: "فشل الاتصال بالخادم . الرجاء معاودة المحاولة في وقت لاحق."
//     },
//     BAG_PRODUCT_ALREADY_EXIST: {
//         en: "Product has been already added to your BAG",
//         ar: "المنتج موجود بالفعل في الحزمة الخاصة بك"
//     },
//     USER_LOGIN_SOCIAL: {
//         en: "This Email is registerd with social login. You can't reset the password for this email.",
//         ar: "تسجيل دخول المستخدم من خلال وسائل التواصل الاجتماعي"
//     },
//     DELETE_VENDOR: {
//         en: "Vendor has been deleted",
//         ar: ""
//     },
//     BLOCK_VENDOR: {
//         en: "Vendor has been blocked",
//         ar: ""
//     },
//     ACTIVE_VENDOR: {
//         en: "Vendor has been activated",
//         ar: ""
//     },
//     COMPARE_SCREEN: {
//         en: "Comparsion of Screen",
//         ar: ""
//     },
//     NOTIFICATION_SCREEN: {
//         en: "Notification Screen",
//         ar: ""
//     },
//     PROFILE_UPDATE: {
//         en: "Profile details has been Uploaded",
//         ar: ""
//     },
//     EDIT_PAYMENT: {
//         en: "Your payment card update",
//         ar: ""
//     },
//     DELET_PAYMENT: {
//         en: "Your card has been removed",
//         ar: ""
//     },
//     DELETE_ADDRESS_SUCCESS: {
//         en: "your address has been deleted",
//         ar: "your address is deleted"
//     },
//     OUT_OF_STOCK: {
//         en: "Some items are not in stock. Please remove it before checkout",
//         ar: "Some items are not in stock please remove it before checkout"
//     },
//     IMPORT_PRODUCT_SUCCESSS: {
//         en: "Import product successfully",
//         ar: "Import product successfully"
//     },
//     TITLE: {

//         PLACED: {
//             en: 'Order has been Placed',
//             ar: ''
//         },
//         DELIVERIED: {
//             en: 'Order has been Deliveried',
//             ar: ''
//         },
//         REJECTED: {
//             en: 'Order has been Rejected',
//             ar: ''
//         },
//         CANCELLED: {
//             en: 'Order has been Cancelled',
//             ar: ''
//         },
//         DISPATCH: {
//             en: 'Order has been Dispatched',
//             ar: ''
//         },
//         INACTIVE: {
//             en: 'INACTIVE',
//             ar: ''
//         }
//     },
//     type: {
//         PLACED: {
//             en: 'PLACED',
//             ar: ''
//         },
//         DELIVERIED: {
//             en: 'DELIVERIED',
//             ar: ''
//         },
//         RREJECTED: {
//             en: 'ORDER REJECTED',
//             ar: ''
//         },
//         CANCELLED: {
//             en: 'CANCELLED',
//             ar: ''
//         },
//         DISPATCH: {
//             en: 'DISPATCHED',
//             ar: ''
//         },
//         INACTIVE: {
//             en: 'INACTIVE',
//             ar: ''
//         }
//     },
//     notifyMsg: {

//         PLACED: {
//             en: 'Your Order has been Placed',
//             ar: ''
//         },
//         DELIVERIED: {
//             en: 'Your Order has been DELIVERIED',
//             ar: ''
//         },
//         RREJECTED: {
//             en: 'Your Order ORDER has been REJECTED',
//             ar: ''
//         },
//         CANCELLED: {
//             en: 'Your Order has been CANCELLED',
//             ar: ''
//         },
//         DISPATCH: {
//             en: 'Your Order has been DISPATCHED',
//             ar: ''
//         },
//         INACTIVE: {
//             en: 'Your Order is INACTIVE',
//             ar: ''
//         }
//     }
// };

let mailModule = nodemailer.createTransport(config.OTP_EMAIL_CONFIG);


let encryptData = (stringToCrypt) => {
    return MD5(MD5(stringToCrypt));
};


let generateTransactionId = () => {
    return Date.now() + Math.floor(Math.random() * 99999) + 10000;
}


let sendActivationMail = (data) => {
    //data.email = "neha.arora@affle.com";
    var mailOptions = {
        from: templates.activationMailTemplate.from,
        to: data.email,
        subject: templates.activationMailTemplate.subject,
        html: mustache.render(templates.activationMailTemplate.html, data)
    };
    mailModule.sendMail(mailOptions, (err, success) => {
        if (err) {
            console.log(err, 'pankaj testing')
        }
    });
}

let sendForgotPasswordMail = (data) => {
    //data.email = "neha.arora@affle.com";
    var mailOptions = {
        from: templates.forgotPasswordMailTemplate.from,
        to: data.email,
        subject: templates.forgotPasswordMailTemplate.subject,
        html: mustache.render(templates.forgotPasswordMailTemplate.html, data)
    };
    mailModule.sendMail(mailOptions);
}

// OAuth2 code
//let authMiddleWare = (req, res, next) => {
//   return function (req, res, next) {
//    if (req.isAuthenticated()) {
//      return next()
//    }
//    res.redirect('/')
//  } 
//}


let getSOAPDataFromServer = (template, data, cb) => {
    //console.log(mustache.render(template, data));
    request.post({
            url: config.SOAP_SERVER_CONFIG.url,
            body: mustache.render(template, data),
            method: 'POST',
            dataType: 'text',
            headers: {
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': config.SOAP_SERVER_CONFIG.soapAction
            }
        },
        (error, response, body) => {
            typeof body == "string" ? body = body.replace(/brm:/g, 'brm')
                .replace(/soapenv:Envelope/g, 'soapenvEnvelope')
                .replace(/soapenv:Body/g, 'soapenvBody')
                .replace(/ns1:opcodeResponse/g, 'ns1opcodeResponse')
                .replace(/ns2:Newuser_App_NotifyResponse/g, 'ns2Newuser_App_NotifyResponse')
                .replace(/opcodeReturn/g, 'opcodeReturn') : "";

            parseString(htmlEnDeCode.htmlDecode(body), (err, result) => {
                console.log(result);
                cb(result);
            });
        });
}

let getRESTDataFromServer = (data, cb) => {
    // set content-type header and data as json in args parameter 
    if (data.customerID) {
        var customerId = data.customerID;
    } else {
        var customerId = "";
    }

    var args = {
        data: {},
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
    };
    var finalUrl = config.REST_SERVER_CONFIG.url + data.apiName + "?username=AFFLE&credentials=apassw0rd&source=SCMOB&service_type=0&sessionID=ABC2872373737367663";
    switch (data.apiName) {
        case "/createTicket":
            finalUrl += "&disposition_id=" + data.disposition_id + "&remarks=" + data.remarks + "&lco_acc_num=" + data.lcoAccNum + "&device_id=" + data.deviceId + "&rmn=" + data.mobileNumber + "&cmts=" + data.cmts + "&ref_id=" + config.REF_CONSTANT.userId;
            break;
        case "/create_lead":
            finalUrl += "&customerName=" + data.customerName + "&pincode=" + data.pincode + "&city=" + data.city + "&area=" + data.area + "&mobileNo=" + data.mobileNo + "&email=" + data.email + "&authUser";
            break;
        case "/getSalesPersonListByPincode":
            // let currentCity = cityDetail.filter(function(obj) {
            //     return obj.eu_city == data.city;
            // })[0];
            finalUrl += "&authUser=" + currentCity.authUser + "&pincode=" + data.pincode;
            break;
    }
    if (data.apiName != "/create_lead") { // to add authUser other than lead generation...
        finalUrl += "&authUser=" + customerId;
    }
    if (data.ticketType) {
        finalUrl += "&ticketType=" + data.ticketType;
    }
    if (data.apiName == "/createTicket") {
        finalUrl += "&disposition_id=" + data.disposition_id + "&remarks=" + data.remarks + "&lco_acc_num=" + data.lcoAccNum + "&device_id=" + data.deviceId + "&rmn=" + data.mobileNumber + "&cmts=NA&ref_id=" + config.REF_CONSTANT.userId;
    }
    console.log(finalUrl);
    request.post(finalUrl, args, function(data, resp) {
        if (!resp) {
            return false;
        }

        cb(resp["body"]);
    });

}

let getUserCreationFromServer = (data, cb) => {
    // fetch city detail from the city detail json file...
    // let currentCity = cityDetail.filter(function(obj) {
    //     return obj.eu_city == data.city;
    // })[0];
    let firstName = data.fullName.split(" ")[0];
    var lastName = data.fullName.split(" ")[1] ? data.fullName.substr(data.fullName.indexOf(" ") + 1) : ".";
    console.log(data, "main data");
    // set content-type header and data as json in args parameter 
    var ts = firstName + Math.floor(new Date().valueOf() * Math.random());;
    //console.log(ts);
    var postData = {
        username: "AFFLE",
        credentials: "apassw0rd",
        source: "SCMOB",
        service_type: "0",
        sessionID: "ABC2872373737367663",
        authUser: currentCity.authUser,
        eu_account_type: 97,
        eu_model: 1,
        eu_subcriber_type: 63,
        eu_currency: 356,
        eu_lco_code: currentCity.eu_lco_code,
        eu_lco_name: currentCity.eu_lco_name,
        eu_username: ts,
        eu_sales_entity_code: data.salesPoid,
        eu_sales_name: data.salesName,
        eu_salution: data.salutation,
        eu_firstname: firstName,
        eu_lastname: lastName,
        eu_middlename: "",
        eu_mobile: data.mobile,
        eu_reg_mobile: data.mobile,
        eu_email: data.email,
        eu_contact_preference: 1,
        eu_pincode: data.pincode,
        eu_areacode: currentCity.eu_areacode,
        eu_area: currentCity.eu_area,
        eu_area_code: currentCity.eu_area_code,
        eu_street: currentCity.eu_street,
        eu_street_code: currentCity.eu_street_code,
        eu_location: currentCity.eu_location,
        eu_location_code: currentCity.eu_location_code,
        eu_building: currentCity.eu_building,
        eu_building_code: currentCity.eu_building_code,
        eu_doorno: data.landmark,
        eu_city: data.city,
        eu_state: currentCity.eu_state,
        eu_country: "INDIA",
        eu_region: currentCity.eu_region,
        eu_landmark: data.landmark,
        debit_acc_type: 1,
        team_name: currentCity.team_name,
        remarks: data.remarks,
        tds_received: 0,
        delivery_method: "",
        work_phone: "",
        home_phone: "",
        parent_or_child: 0,
        parent_accountID: "",
        parent_account_poid: "",
        inc_salutation: "",
        inc_first_name: "",
        inc_middle_name: "",
        inc_last_name: "",
        inc_pincode: data.pincode,
        inc_areacode: "",
        inc_area: currentCity.eu_area,
        inc_area_code: "",
        inc_street: currentCity.eu_street,
        inc_street_code: "",
        inc_location: currentCity.eu_building,
        inc_location_code: "",
        inc_building: ".",
        inc_building_code: "",
        inc_landmark: data.landmark,
        inc_doorno: data.landmark,
        inc_city: data.city,
        inc_state: currentCity.eu_state,
        inc_country: "INDIA",
        inc_region: currentCity.eu_region,
        corp_salutation: "",
        corp_firstname: "",
        corp_middlename: "",
        corp_lastname: "",
        corp_pincode: data.pincode,
        corp_area: currentCity.eu_area,
        corp_street: currentCity.eu_street,
        corp_location: currentCity.eu_location,
        corp_builidng: currentCity.eu_building,
        corp_doorno: 56,
        corp_landmark: data.landmark,
        corp_city: data.city,
        corp_state: "",
        corp_country: "INDIA",
        corp_region: currentCity.eu_region,
        eu_contact_preference: 1,
        end_id_proof: 2,
        end_address_proof: 5
    };
    console.log(postData);
    var encodedData = querystring.stringify(postData);

    /*var main_data = function(postData) {
        var str = [];
        for(var p in postData){
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(postData[p]));
         str.join("&");
        } 
    }*/

    var args = {
        data: encodedData,
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
    };
    //console.log(args);
    var finalUrl = config.REST_SERVER_CONFIG.url + data.apiName;

    request({
        headers: {
            'Content-Length': encodedData.length,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        uri: finalUrl,
        body: encodedData,
        method: 'POST'
    }, function(err, res, body) {
        console.log(body);
        cb(body);
    });

    /*    console.log(finalUrl);
        request.post(finalUrl, args, function (data, resp) {
            if(!resp){
                return false;
            }
            cb(resp["body"]);
        });    
       */
}

let uploadFileToS3Bucket = (file, folder, newFileName, callback) => {
    if (file == undefined) {
        console.log("No file file undefined");
        return callback("No File");
    } else {
        console.log(file);
        var filename = file.filename; // actual filename of file
        var path = file.path; //will be put into a temp directory
        var mimeType = file.mimetype;

        fs.readFile(path, function(error, file_buffer) {

            if (error) {
                console.log("No file");
                console.log(error);
                //  //console.log(error)
                return callback("No File");
            } else {
                var length = 5;
                var str = '';
                var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                var size = chars.length;
                for (var i = 0; i < length; i++) {

                    var randomnumber = Math.floor(Math.random() * size);
                    str = chars[randomnumber] + str;
                }

                filename = newFileName;
                filename = filename.split(' ').join('-');


                var s3bucket = new AWS.S3();
                var params = {
                    Bucket: "mobileapp.net",
                    Key: folder + '/' + filename,
                    Body: file_buffer,
                    ACL: 'public-read',
                    ContentType: mimeType
                };

                s3bucket.putObject(params, function(err, data) {
                    if (err) {
                        console.log("No file");
                        console.log(err)
                        return callback("No File");
                    } else {
                        return callback(folder + '/' + filename);
                    }
                });
            }
        });
    }
};

let managePushFromServer = (template, data, cb) => {

    request.post({
            url: config.SOAP_PUSH_SERVER_CONFIG.url,
            body: mustache.render(template, data),
            method: 'POST',
            dataType: 'text',
            headers: {
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': config.SOAP_PUSH_SERVER_CONFIG.soapAction
            }
        },
        (error, response, body) => {
            console.log(body);
            typeof body == "string" ? body = body.replace(/brm:/g, 'brm')
                .replace(/S:Envelope/g, 'sEnvelope')
                .replace(/xmlns:S/g, 'xmlns')
                .replace(/xmlns:ns2/g, 'xmlnsns2')
                .replace(/ns2:User_Notification_DetailsResponse/g, 'ns2Details')
                .replace(/return/g, 'rtrn')
                .replace(/ns2:Signout_App_NotifyResponse/g, 'ns2Signout_App_NotifyResponse')
                .replace(/ns2:Device_statusResponse/g, 'ns2Device_statusResponse')
                .replace(/S:Body/g, 'sBody') : "";

            parseString(htmlEnDeCode.htmlDecode(body), (err, result) => {

                cb(result);
            });
        });
}



module.exports = {
    statusCode: statusCode,
    statusMessage: statusMessage,
    encryptData: encryptData,
    sendActivationMail: sendActivationMail,
    sendForgotPasswordMail: sendForgotPasswordMail
}