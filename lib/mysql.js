/**
 * Primary Module Requirements
 */
var mysql = require( "mysql" );
var Storage = require( "storage.json" );

/**
 * Generic Database driver for MySQL databases.
 * @constructor
 */
var Database = function( channel ){
    var $this = this;

    /**
     * Gets all records from the current table.
     * @param callback
     * @returns {*}
     */
    this.gather = function( callback ){
        var sql = mysql.format( 'SELECT * FROM ??', [ $this.table ]);

        return $this.execute( sql, callback );
    };

    /**
     * Selects a record by "id".
     * @param options
     * @param callback
     * @returns {*}
     */
    this.select = function( record, callback ){
        var sql = mysql.format( 'SELECT * FROM ?? WHERE ?? = ?' + where, [ $this.table, 'id', record.id ]);

        return $this.execute( sql, callback );
    };

    /**
     * Checks that the "id" of a new record does not exist in the table.
     * If it does not exist, a new record is created. Otherwise, the
     * existing record will be modified to contain the new record.
     * @param record
     * @param callback
     */
    this.insert = function( record, callback ){
        var insert = mysql.format( 'INSERT INTO ?? SET ?', [ $this.table, record ]);
        var sql = mysql.format( insert + ' ON DUPLICATE KEY UPDATE ?? = ?', [ 'id', record.id ]);

        return $this.execute( sql, callback );
    };

    /**
     * Modifies a record in the table based on the new data provided.
     * @param id
     * @param record
     * @param callback
     * @returns {*}
     */
    this.update = function( record, callback ){
        var update = mysql.format( 'UPDATE ?? SET ?', [ $this.table, record ]);
        var sql = mysql.format( update + ' WHERE ?? = ?', [ 'id', record.id ]);

        return $this.execute( sql, callback );
    };

    /**
     * Deletes a record from the table by "id"
     * @param id
     * @param callback
     * @returns {*}
     */
    this.delete = function( record, callback ){
        var sql = mysql.format( 'DELETE FROM ?? WHERE ?? = ?', [ $this.table, 'id', record.id ]);

        return $this.execute( sql, callback );
    };

    /**
     * Sets database values equal to the contents of records.
     * @param records
     * @param callback
     */
    this.refresh = function( records, callback ){
        $this.gather( function( results ){
            if( results.length > records.length){
                var last_id = records[ records.length - 1].id;
                var sql = mysql.format( 'DELETE FROM ?? WHERE ?? > ?', [ $this.table, 'id', last_id ]);
                $this.execute( sql, function( result ){
                    var deletedRows = result.affectedRows;
                    $this.several({ insert: records }, callback );
                });
            } else{
                $this.several({ insert: records }, callback );
            }
        });
    };

    /**
     * Empty's this.table of all records to prepare for updated data.
     */
    this.truncate = function( callback ){
        $this.gather( function( results ){
            var sql = mysql.format( 'TRUNCATE TABLE ??', [ $this.table ]);
            return $this.execute( sql, function( result ){
                if( results.length ) result.destroyedRows = results.length;
                callback( result );
            });
        });
    };

    /**
     * Selects a set of records by the "options" object received.
     * @param options
     * @param callback
     * @returns {*}
     */
    this.search = function( options, callback ){
        var wheres = 0;
        var query = 'SELECT * FROM ??';
        var selection = [ $this.table ];

        for( var column in options ){
            if( wheres < 4 && options[ column ]){
                selection.push( column );
                selection.push( options[ column ]);
                var append = wheres === 0 ? " WHERE ?? = ?" : " AND ?? = ?";
                query += append;
                wheres++;
            }
        }

        var sql = mysql.format( query, selection );

        return $this.execute( sql, callback );
    };

    /**
     * Performs multiple queries based on several records.
     * @param records : { <action>: [{<record>}, {<record>}]}
     * @param callback
     */
    this.several = function( records, callback ){
        for( var action in records ){
            for( var index in records[ action ]){
                $this[ action ]( records[ action ][ index ], callback );
            }
        }
    };

    /**
     * Handle the execution of the query and callback, by getting a connection from the pool.
     * @param sql
     * @param callback
     */
    this.execute = function( sql, callback ){
        if( ! callback || typeof callback != 'function' ) $this.failure( "You must include a callback when executing DB queries." );

        $this.db.getConnection( function( err, db ){
            db.query( sql, function( error, result ) {
                if( error ) $this.failure( "DB Error : SQL:" + sql, error );

                else callback( result );

                return db.release();
            });
        });
    };

    /**
     * Outputs an error message from the database.
     * @param message
     * @param error
     * @returns {*}
     */
    this.failure = function( message, error ){
        var err = typeof message == 'object' ? message : error;
        var stk = err.stack ? err.stack : "No stack trace information.";
        var msg = typeof message == 'string' ? message : "Database ERROR:";

        console.error( msg, stk );

        throw err;
    };

    /**
     * Prepares the database table for collection and monitoring of live data.
     * @param channel
     */
    this.boot = function( channel ){
        $this.pending = [];
        $this.config = new Storage( "./config" );

        $this.config.load( "cudatel_ws_db", function( config ){
            $this.table = config.db_link[ channel ];
            $this.db = mysql.createPool( config.db_config );
        });
    };

    /**
     * Execute the module bootstrap command.
     */
    $this.boot( channel );
};

/**
 * Exports the "MySQL" Database module.
 */
module.exports = Database;
