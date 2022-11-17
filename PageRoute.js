const { Router } = require("express");
const Config = require("./config");
const MinecraftServer = require("./MinecraftServer");

module.exports = class PageRoute {
    /**
     * @param {null|Config} config
     * @param {null|MinecraftServer} minecraft
     */
    constructor(config = null, minecraft = null) {
        /** @type {Router} */
        this.app = Router();

        /** @type {Config} */
        this.config = config;

        /** @type {MinecraftServer} */
        this.minecraft = minecraft;

        this.init();
    }

    init() {  }
}