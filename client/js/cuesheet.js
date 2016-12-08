(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cuesheet = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

module.exports.CueSheet = CueSheet;
module.exports.File = File;
module.exports.Track = Track;
module.exports.Index = Index;
module.exports.Time = Time;

function CueSheet() {
    this.catalog = null;
    this.cdTextFile = null;
    this.files = null;
    this.performer = null;
    this.songWriter = null;
    this.title = null;
    this.rems = null;
}

function File() {
    this.name = null;
    this.type = null;
    this.tracks = null;
}

function Track(number, type) {
    this.number = (number === undefined ? null : number);
    this.type = (type || null);
    this.title = null;
    this.flags = null;
    this.isrc = null;
    this.performer = null;
    this.songWriter = null;
    this.pregap = null;
    this.postgap = null;
    this.indexes = null;
}

function Index(number, time) {
    this.number = (number === undefined ? null : number);
    this.time = (time || null);
}

function Time(min, sec, frame) {
    this.min = min || 0;
    this.sec = sec || 0;
    this.frame = frame || 0;
}

CueSheet.prototype.getCurrentFile = function() {
    if (this.files && this.files.length > 0) {
        return this.files[this.files.length - 1];
    } else {
        return null;
    }
}

CueSheet.prototype.getCurrentTrack = function() {
    var file = this.getCurrentFile();

    if (file && file.tracks && file.tracks.length > 0) {
        return file.tracks[file.tracks.length - 1];
    } else {
        return null;
    }
};

CueSheet.prototype.newFile = function() {
    if (!this.files) {
        this.files = [];
    }

    this.files.push(new File());

    return this;
};

CueSheet.prototype.newTrack = function(number, type) {
    var file = this.getCurrentFile();

    if (!file) {
        throw new Error('No file for track: ' + number + type);
    }

    if (!file.tracks) {
        file.tracks = [];
    }

    file.tracks.push(new Track(number, type));

    return this;
};
},{}]},{},[1])(1)
});