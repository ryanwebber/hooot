
define(['react', 'jquery', 'app/controllers/upload/QueuedUploader'], 
    function (React, $, QueuedUploader) {

        var UploadShowForm = React.createClass({
            mixins: [React.addons.LinkedStateMixin],
            getInitialState: function() {
                return {
                    files: [],
                    data: {},
                    loading: false,
                    upload: null
                };
            },
            makeValueLink: function (key) {
                return {
                    value: this.state.data[key],
                    requestChange: function(newValue) {
                        newState = this.state.data;
                        newState[key] = newValue;
                        this.setState({data: newState});
                    }.bind(this)
                }
            },
            setLoading: function(val){
                var state = this.state;
                state.loading = val;
                this.setState(state);
            },
            onFileChanged: function(files){
                obj = $(files.target)[0].files;

                if(obj.length < 1){
                    return;
                }

                files = []
                for(var i=0; i<obj.length;i++){
                    files.push(obj[i]);
                }

                this.setLoading(true);
                $.get("/upload/show/autofill", {
                    "filenames[]": files.map(function(file){return file.name;})
                }).done(function(result){
                    this.setState({
                        data: result,
                        files: files
                    });
                }.bind(this)).fail(function(err){
                    // Not much to do
                }).always(function(){
                    this.setLoading(false);
                }.bind(this));
            },
            submit: function(){

                $.post("/show/prepare", {
                    cover: this.state.data.cover,
                    description: this.state.data.description,
                    name: this.state.data.name,
                    poster: this.state.data.poster,
                    trakt_id: this.state.data.trakt_id,
                }).done(function(show){
                    $.post("/season/prepare", {
                        seasonNumber: this.state.data.season,
                        show: show.id
                    }).done(function(season){
                        var uploader = new QueuedUploader(this.state.files, {
                            url: this.props.url,
                            fileData: function(file){
                                var episode = this.state.data.episodes[file.name];
                                return {
                                    season: this.state.data.season,

                                    show_id: show.id,
                                    show_cover: this.state.data.cover,
                                    show_description: this.state.data.description,
                                    show_name: this.state.data.name,
                                    show_poster: this.state.data.poster,
                                    show_trakt_id: this.state.data.trakt_id,

                                    episode_name: episode.name,
                                    episode_description: episode.description,
                                    episode_trakt_id: episode.trakt_id,
                                    episode_screenshot: episode.screenshot,
                                    episode_number: episode.episode

                                };
                            }.bind(this),
                            onFileComplete: function(file){
                                console.log("Completed:", file.name);
                            },
                            onFileComplete: function(file){
                                console.log("Completed:", file.name);
                            },
                            onSuccess: function(){
                                this.setState({
                                    upload: {
                                        progress: 100,
                                        complete: true
                                    }
                                });
                            }.bind(this),
                            onProgress: function(prog){
                                var updates = this.state.upload;
                                updates = updates || {};

                                updates[prog.file.name] = {
                                    progress: prog.percent,
                                    complete: false
                                }
                                this.setState({
                                    upload: updates
                                });
                            }.bind(this)
                        });

                        uploader.submit();
                    }.bind(this)).fail(function(){
                        //nothing yet for fail
                    }.bind(this));
                }.bind(this)).fail(function(){
                    // error :(
                }.bind(this));
            },
            componentDidMount: function() {
                // TODO stuff
            },
            componentWillUnmount: function(){
                // TODO stuff
            },
            render: function(){
                var data = this.state.data;

                if(this.state.loading === true){
                    return(
                        <div className="spinner center--all"></div>
                    );
                }else if(this.state.upload){
                    return (null);
                    var style = {
                        width: this.state.upload.progress + "100%"
                    };
                    var size = {
                        width: "400px",
                        maxWidth: "90%"
                    };
                    if(this.state.upload.complete){
                        var text = "Done";
                        var cl = "progress center--all";
                    }else{
                        var text = style.width;
                        var cl = "progress progress--striped center--all progress--animate";
                    }
                    return(
                        <div className={cl} style={size}>
                            <span style={style}>{text}</span>
                        </div>
                    );
                }else if(this.state.files.length){
                    return(
                        <div className="upload-form">
                            <div className="page-block">
                                <h1>Show Meta Data</h1>
                                <form>
                                    <p>
                                        <label>Show Title:</label>
                                        <input type="text" valueLink={this.makeValueLink('name')} placeholder="Movie Title" />
                                    </p>
                                    <p>
                                        <label>Season:</label>
                                        <input type="text" valueLink={this.makeValueLink('season')} placeholder="Season" />
                                    </p>
                                    <p>
                                        <label>Trakt ID:</label>
                                        <input type="text" valueLink={this.makeValueLink('trakt_id')} placeholder="Trakt ID" />
                                    </p>
                                    <p>
                                        <label>Poster URL:</label>
                                        <input type="text" valueLink={this.makeValueLink('poster')} placeholder="Poster URL" />
                                    </p>
                                    <p>
                                        <label>Cover URL:</label>
                                        <input type="text" valueLink={this.makeValueLink('cover')} placeholder="Cover URL" />
                                    </p>
                                    <p>
                                        <label>Description:</label>
                                        <textarea type="text" valueLink={this.makeValueLink('description')} placeholder="Description" rows="7"/>
                                    </p>
                                </form>
                                <button onClick={this.submit}>Upload</button>
                            </div>
                        </div>
                    );
                }else{
                    return(
                        <div className="center--all">
                            <input id="file" type="file" className="inputfile" onChange={this.onFileChanged} multiple="multiple"/>
                            <label htmlFor="file"><i className="fa fa-upload"></i> Upload Show Episodes...</label>
                        </div>
                    );
                }
            }
        });
        return UploadShowForm;

    }
);