"use strict";var _=(function(){ /* TODO (Joshua): We should probably just use underscore or lodash and not
       both */var lodash=require("lodash");var underscore=require("underscore");var _=underscore.extendOwn(lodash,underscore,{getPathParent:function getPathParent(obj){var path=arguments.length <= 1 || arguments[1] === undefined?"":arguments[1];path = path.split(".");var ref=obj;while(path.length > 1 && ref !== undefined) {ref = ref[path.shift()];}return ref;},getPathData:function getPathData(obj){var path=arguments.length <= 1 || arguments[1] === undefined?"":arguments[1];return {ref:_.getPathParent(obj,path),key:_.getPathTail(path)};},getPathValue:function getPathValue(obj){var path=arguments.length <= 1 || arguments[1] === undefined?"":arguments[1];var _$getPathData=_.getPathData(obj,path);var ref=_$getPathData.ref;var key=_$getPathData.key;if(ref !== undefined){return ref[key];}},getPathTail:function getPathTail(){var path=arguments.length <= 0 || arguments[0] === undefined?"":arguments[0];return path.split(".").pop();}});module.exports = _;return _;})();