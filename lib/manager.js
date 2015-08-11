/**
 * Primary module requirements.
 * @type {exports}
 */
var util = require( "util" );
var events = require( 'events' );
var Storage = require( "storage.json" );

/**
 * The currently configured database driver module.
 * @property db
 * @property table
 * @function gather
 * @function locate
 * @function select
 * @function insert
 * @function update
 * @function delete
 * @function execute
 * @function cleanup
 * @function prepare
 * @function failure
 */
var Database;

/**
 * The instantiation of the database "drivers module" manager.
 */
var manager;

/**
 * Contains parsers for call records, within messages, received through the tunnel.
 * Parses message data and handles it by both emitting it as an event, and using
 * it to maintain a database table ( If correctly configured in config.json )
 * @constructor
 */
var Manager = function(){
    var $this = this;
    events.EventEmitter.call( this );

    this.config;

    this.load = function( channel ){
        $this.config = new Storage( "./config" );

        $this.config.load( "cudatel_ws_db", function( config ){
            Database = require( "./" + config.db_type );
            return new Database( channel );
        });
    };
};

/**
 * Manager inheritance from events.EventEmitter
 * @type {Object|Function|exports.EventEmitter}
 * @private
 */
util.inherits( Manager, events.EventEmitter );

/**
 * Called PRIOR TO export to ensure that all variable values from "config.json"
 * have been loaded. Sets all initial variables to their respective values.
 * Instantiates any modules requiring instantiation, prior to exporting.
 */
var bootstrap = function(){
    manager = new Manager();
};

/**
 * Execute the bootstrap command before exporting
 */
bootstrap();

/**
 * Exports an instantiation of the Manager module.
 */
module.exports = manager;