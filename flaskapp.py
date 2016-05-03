import os
import sys
import re
import requests
from keys import YOUTUBE_API_KEY
from datetime import datetime
from random import randint
import uuid
from flask import Flask, render_template, send_from_directory, flash, json, Response, request, redirect, url_for, \
    session
from flask.ext.script import Manager, Server
from flask.ext.bootstrap import Bootstrap
from flask.ext.moment import Moment
from flask.ext.wtf import Form
from wtforms import StringField, SubmitField, TextAreaField, PasswordField, BooleanField, validators
from flask_wtf.file import FileField, FileAllowed, FileRequired
from wtforms.validators import Required
from flask.ext.sqlalchemy import SQLAlchemy
from werkzeug import secure_filename, generate_password_hash, check_password_hash
from flask.ext.login import LoginManager, UserMixin, AnonymousUserMixin, login_required, login_user, logout_user, \
    current_user

#TODO: Make seperate distinct pages for create station join station
#TODO: JS to send server when video starts and ends so now playing and video history can update on update
#TODO: URL/Query switching button on input bar
#TODO: mobile format, large sticky search bar at bottom, possibly desktop too
#TODO:Clean up code thoroughly

IMG_FOLDER = '/Users/Jon/Google_Drive/Github/cs205/MegsArtist/MegsArtist/img/'
TRACK_FOLDER = '/Users/Jon/Google_Drive/Github/cs205/MegsArtist/MegsArtist/track/'
# IMG_FOLDER = '/home/ubuntu/flaskapp/img/'
# TRACK_FOLDER = '/home/ubuntu/flaskapp/track/'
# IMG_FOLDER = '/Users/rebeccahong/Desktop/MegsArtist/MegsArtist/img/'
# TRACK_FOLDER = '/Users/rebeccahong/Desktop/MegsArtist/MegsArtist/track/'

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
app.config['SECRET_KEY'] = 'hard to guess string'
app.config['SQLALCHEMY_DATABASE_URI'] = \
    'sqlite:///' + os.path.join(basedir, 'data.sqlite')
app.config['IMG_FOLDER'] = IMG_FOLDER
app.config['TRACK_FOLDER'] = TRACK_FOLDER
app.config['SQLALCHEMY_COMMIT_ON_TEARDOWN'] = True
WTF_CSRF_SECRET_KEY = 'a random string'

manager = Manager(app)
bootstrap = Bootstrap(app)
moment = Moment(app)
db = SQLAlchemy(app)

login_manager = LoginManager()
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


'''
artist_to_tag = db.Table('artist_to_tag',
                         db.Column('artist_id', db.Integer, db.ForeignKey('artist.id')),
                         db.Column('tag_id', db.Integer, db.ForeignKey('tag.id')),
                         db.PrimaryKeyConstraint('artist_id', 'tag_id')
                         )

track_to_tag = db.Table('track_to_tag',
                        db.Column('track_id', db.Integer, db.ForeignKey('track.id')),
                        db.Column('tag_id', db.Integer, db.ForeignKey('tag.id')),
                        db.PrimaryKeyConstraint('track_id', 'tag_id')
                        )

class User(UserMixin, db.Model):
    # __tablename__ = 'artist'
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(64), index=True)
    last_name = db.Column(db.String(64), index=True)
    email = db.Column(db.String(64), unique=True, index=True)
    artist_id = db.Column(db.Integer, db.ForeignKey('artist.id'))
    password_hash = db.Column(db.String(128))


    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password)

    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)
    def __repr__(self):
        return '<User %r>' % self.name


class AnonymousUser(AnonymousUserMixin):
    def can(self, permissions):
        return False

    def is_administrator(self):
        return False

login_manager.anonymous_user = AnonymousUser

# initiates Tag table
class Tag(db.Model):
    # __tablename__ = 'tag'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True)
    # artist = db.relationship('Artist', backref='tag', lazy='dynamic')
    # TODO: relationship with tag and track
    artists = db.relationship('Artist', secondary=artist_to_tag,
                              backref=db.backref('tag', lazy='dynamic'))
    tracks = db.relationship('Track', secondary=track_to_tag,
                             backref=db.backref('tag', lazy='dynamic'))

    def __repr__(self):
        return '<Tag %r>' % self.name


# IMPORTANT: Get ALl Artists by tag: x = Artist.query.filter(Artist.tags.any(name="Test")).all()
# Get Artist object by name, with Tags

# initiates Artist table

'''


# START


class User(UserMixin, db.Model):
    # __tablename__ = 'artist'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), index=True)
    session_id = db.Column(db.Integer, db.ForeignKey('session.id'))
    time_joined = db.Column(db.DateTime())
    time_updated = db.Column(db.DateTime())
    is_player = 0

    def __repr__(self):
        return '<User %r>' % self.name

    def get_dict(self):
        dict = {'Name': self.name}
        return dict


class AnonymousUser(AnonymousUserMixin):
    def can(self, permissions):
        return False

    def is_administrator(self):
        return False


login_manager.anonymous_user = AnonymousUser


class Session(db.Model):
    # __tablename__ = 'artist'
    id = db.Column(db.Integer, primary_key=True)
    hex_key = db.Column(db.String(3), unique=True)
    description = db.Column(db.String(264), unique=False)
    # image = db.Column(db.String(264), unique=False)
    users = db.relationship('User', backref='session', lazy='dynamic')

    def isInitialized(self):
        return self.description is not None

    def __repr__(self):
        return '<Session %r>' % self.name

#TODO add was_played boolean so pages can be built and updated with accurate history
class Playable(db.Model):
    # __tablename__ = 'playable'
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(64), unique=False)
    name = db.Column(db.String(256), unique=False)
    thumb_url = db.Column(db.String(256), unique=False)
    session_id = db.Column(db.Integer, db.ForeignKey('session.id'))
    added_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    score = db.Column(db.Integer(), unique=False)
    time_modified = db.Column(db.DateTime())

    def __repr__(self):
        return '<Playable %r>' % self.url
    def user_vote(self):
        vote_obj = Vote.query.filter(
            current_user.id == Vote.added_by_id,
            current_user.session_id == Vote.session_id,
            self.id == Vote.playable_id
        ).first()
        if vote_obj is None:
            return 0
        else:
            return vote_obj.value
    def get_dict(self):

        dict = {'url': self.url, 'score': self.score, 'name': self.name, 'thumb_url': self.thumb_url, 'user_vote':self.user_vote()}
        return dict

class Vote(db.Model):
    # __tablename__ = 'playable'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('session.id'))
    playable_id = db.Column(db.Integer, db.ForeignKey('session.id'))
    added_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    value = db.Column(db.Integer())
    time_modified = db.Column(db.DateTime())

    def __repr__(self):
        return '<Playable %r>' % self.url

class NicknameForm(Form):
    # artistName = StringField('Artist Name*', validators=[Required()])
    name = StringField('Nickname')
    submit = SubmitField('Submit')

    def reset(self):
        self.name.data = ""


class JoinForm(Form):
    # artistName = StringField('Artist Name*', validators=[Required()])
    name = StringField('Nickname')
    hex_key = StringField('Hex Key')
    submit = SubmitField('Submit')

    def reset(self):
        self.name.data = ""


'''
@app.route('/session/join', methods=['GET', 'POST'])
def join_session():
    joinForm = JoinForm()
    # TODO error message if user enters something other than 3 digit hex
    if joinForm.validate_on_submit():
        hex_key = joinForm.hex_key.data
        name = joinForm.name.data
        session = Session.query.filter_by(hex_key=hex_key).first()
        if session is None:
            message = "Error: The session '" + hex_key + "' does not exist. Please <a href='/'>create a session</a> or do **something else."
            flash(message, "error")  # TODO
            return render_template('create_session.html', nicknameForm=joinForm)
        else:
            user = User(name=name,
                        session=session)
            db.session.add(user)
            db.session.commit()
            login_user(user)
            users = User.query.filter_by(session_id=session.id).all()
            return render_template('session.html', users=users)
    return render_template('create_session.html', nicknameForm=joinForm)

'''


@app.route('/session/<url_hex_key>', methods=['GET', 'POST'])
def join_session(url_hex_key):
    joinForm = NicknameForm()
    session = Session.query.filter_by(hex_key=url_hex_key).first()
    if session is None:
        print("session is none")
        message = "Error: The session '" + url_hex_key + "' does not exist. Please <a href='/'>create a session</a> or do **something else."
        flash(message, "error")  # TODO
        return render_template('create_session.html', nicknameForm=joinForm)

    users = User.query.filter_by(session_id=session.id).all()

    # could reduce this logic
    if current_user.is_authenticated and current_user.session.hex_key == url_hex_key:
        playables = Playable.query.filter_by(session_id=session.id).order_by(Playable.score.desc())
        return render_template('session.html', users=users, playables=playables)
    if joinForm.validate_on_submit():
        name = joinForm.name.data
        session = Session.query.filter_by(hex_key=url_hex_key).first()
        now = datetime.utcnow()
        user = User(name=name,
                    session=session,
                    time_updated=now,
                    time_joined=now)
        db.session.add(user)
        db.session.commit()
        login_user(user)
        users = User.query.filter_by(session_id=session.id).all()
        playables = Playable.query.filter_by(session_id=session.id).order_by(Playable.score)
        return render_template('session.html', users=users, playables=playables)

    return render_template('create_session.html', nicknameForm=joinForm)


@app.route('/', methods=['GET', 'POST'])
def new_session():
    print(YOUTUBE_API_KEY)
    print("session created")

    nicknameForm = NicknameForm()
    if nicknameForm.validate_on_submit():

        while True:
            session_hex = hex(randint(291, 4095))[2:]  # random 3 digit hex
            hex_check = Session.query.filter_by(hex_key=session_hex).first()
            if hex_check is None:
                break
        session = Session(hex_key=session_hex)
        now = datetime.utcnow()
        user = User(name=nicknameForm.name.data,
                    session=session,
                    time_updated=now,
                    time_joined=now)
        db.session.add(session)
        db.session.add(user)
        db.session.commit()
        login_user(user)
        users = User.query.filter_by(session_id=session.id).all()
        print(session.hex_key)
        print(current_user.is_authenticated)
        return redirect("/session/" + session_hex)
    return render_template('create_session.html', nicknameForm=nicknameForm)


@app.route('/session/add', methods=['POST'])
def addPlayable():
    jsonData = request.json
    hex_key = current_user.session.hex_key
    session = Session.query.filter_by(hex_key=hex_key).first()
    playable_url = jsonData.get('newPlayable')
    # parsing url
    split_playable_url = re.split(r'(v=+|\?+|/+)', playable_url)
    if len(split_playable_url) > 1:
        if "v=" in split_playable_url:
            playable_url = split_playable_url[split_playable_url.index("v=") + 1]
        else:
            playable_url = split_playable_url[split_playable_url.index("/") + 1]
    # getting name and thumbnail from youtube
    if(len(playable_url) == 11):
        playable = Playable.query.filter(
            current_user.session_id == Playable.session_id,
            Playable.url == playable_url
        ).first()
        # checks for duplicate, TODO add error if duplicate
        if playable is None:
            params = {'part': 'id,snippet', 'id': playable_url, 'key': YOUTUBE_API_KEY}
            r = (requests.get('https://www.googleapis.com/youtube/v3/videos', params=params)).json()
            print("R: ")
            print(r)
            playable_name = r['items'][0]['snippet']['title']
            thumb_url = r['items'][0]['snippet']['thumbnails']['default']['url']

            playable = Playable(url=playable_url,
                                session_id=session.id,
                                added_by_id=current_user.id,
                                score=0,
                                name=playable_name,
                                thumb_url=thumb_url
                                )
            playable.time_modified = datetime.utcnow()
            print(playable.time_modified)
            db.session.add(playable)
            db.session.commit()
            newPlayableID = Playable.query.filter_by(url=playable_url).first().id
            # send back success message to js with new tag ID
            return json.dumps({'success': True, 'playable_id': newPlayableID}), 200, {'ContentType': 'application/json'}
    return json.dumps({'result': 'error'}), 400, {'ContentType': 'application/json'} #TODO give differenent response if already added


@app.route('/session/update/', methods=['GET'])
# should recieve time last updated (from here) and return playable added since then, can maybe get from current user
def getUpdate():
    playables = []
    users = []
    try:
        playables = Playable.query.filter(
            current_user.session_id == Playable.session_id,
            current_user.time_updated < Playable.time_modified
        )
    except:
        print("Unexpected Playable error:", sys.exc_info()[0])

    try:
        users = User.query.filter(
            current_user.session_id == User.session_id,
            current_user.time_updated < User.time_joined
        )
    except:
        print("Unexpected User error:", sys.exc_info()[0])
    current_user.time_updated = datetime.utcnow()
    users = [user.get_dict() for user in users]
    playables = [playable.get_dict() for playable in playables]
    dict = {'users': users, 'playables': playables}
    print(users)

    return Response(json.dumps(dict), mimetype='application/json')


@app.route('/session/vote', methods=['POST'])
def vote():
    print("Voting")
    jsonData = request.json
    url = jsonData.get('url')
    value = jsonData.get('vote')
    playable = Playable.query.filter(
        current_user.session_id == Playable.session_id,
        Playable.url == url
    ).first()
    user_id = current_user.id
    vote_obj = Vote.query.filter(
        user_id == Vote.added_by_id,
        current_user.session_id == Vote.session_id,
        playable.id == Vote.playable_id
    ).first()
    print("Old Score: " + str(playable.score))
    #if user hasn't voted
    if vote_obj is None:
        print("voteobj is none")
        vote_obj = Vote(
            added_by_id = user_id,
            playable_id = playable.id,
            session_id = playable.session_id,
            value = value
        )
        db.session.add(vote_obj)
        db.session.commit()
        playable.score += value
    elif value != vote_obj.value:
        print(value,vote_obj.value)
        playable.score -= vote_obj.value
        vote_obj.value = value
        playable.score += vote_obj.value


    print("New Score: " + str(playable.score))
    playable.time_modified = datetime.utcnow()
    # send back success message to js with new tag ID
    return json.dumps({'success': True, 'new_score': playable.score}), 200, {'ContentType': 'application/json'}


'''
##todo, check that email is unique
emailCheck = User.query.filter_by(email=email).first()
if artistCheck is None and emailCheck is None: #this is checking that the artist doesn't yet exist, if it does it will give them an error
    artist = Artist(name=artistName)

    user = User(
        first_name=nicknameForm.firstName.data,
        last_name=nicknameForm.lastName.data,
        email=nicknameForm.email.data,
        password = nicknameForm.password.data,
        #Random TODO add attribute to artist to say if initialized, won't be public until true
        artist_id = artist.id
    )
    db.session.add(user)
    db.session.commit()
    flash("User successfully added")
    login_user(user)
    return redirect('artists/add/')
else:
    if emailCheck is not None:
        message = "Error: "+email+ " Has Already Been Registered.  <a href='/login/" + artistName + "'>Login?</a>"
        flash(message,"error") #TODO
        nicknameForm.email.data = ""
    if artistCheck is not None:
        message = "Error: "+artistName + " Already Exists.  <a href='/artists/" + artistName + "'>View Page</a>"
        flash(message,"error") #TODO
        nicknameForm.artistName.data = ""
        '''  # STOP
'''
class Artist(db.Model):
    # __tablename__ = 'artist'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True)
    description = db.Column(db.String(264), unique=False)
    image = db.Column(db.String(264), unique=False)
    tags = db.relationship('Tag', secondary=artist_to_tag,
                           backref=db.backref('artist', lazy='dynamic'))
    users = db.relationship('User', backref='artist', lazy='dynamic')

    def isInitialized(self):
        return self.description is not None

    def __repr__(self):
        return '<Artist %r>' % self.name

# initiates Track table
class Track(db.Model):
    # __tablename__ = 'track'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=False)
    artist_id = db.Column(db.Integer, db.ForeignKey('artist.id'))
    url = db.Column(db.String(264), unique=False)
    tags = db.relationship('Tag', secondary=track_to_tag,
                           backref=db.backref('track', lazy='dynamic'))

    def __repr__(self):
        return '<Track %r>' % self.name

class Event(db.Model):
    __tablename__ = 'event'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, index=True)
    artist_id = db.Column(db.Integer, db.ForeignKey('artist.id'))
    address = db.Column(db.String(264), unique=False, index=True)
    city = db.Column(db.String(64), unique=False, index=True)

    def __repr__(self):
        return '<Event %r>' % self.name


class ArtistForm(Form):
    #artistName = StringField('Artist Name*', validators=[Required()])
    # artistTags = SelectMultipleField(u'Tag', coerce=int, validators=[validators.NumberRange(message="Not a Valid Option")])
    artistTags = StringField('Artist Tags (Comma Seperated)')
    artistDescription = TextAreaField('Description')
    artistImage = FileField('Upload a Profile Image',validators=[FileAllowed(['jpg', 'png', 'gif'],
                                                                 "Supported file extensions: .jpg .png .gif")])
    # photo = FileField('Your photo')
    submit = SubmitField('Submit')

    def reset(self):
        self.artistDescription.data = self.artistImage.data = ""

class TrackForm(Form):
    #artistName = StringField('Artist Name*', validators=[Required()])
    trackName = StringField('Track Name*', validators=[Required()])
    trackTags = StringField('Track Tags')
    trackURL = FileField('Upload your track', validators=[FileRequired(), FileAllowed(['mp3', 'wav', 'flac'],
                                                          "Supported file extensions: .mp3 .wav .flac")])
    submit = SubmitField('Submit')

    def reset(self):
        self.trackName.data = self.trackURL.data = ""

class EventForm(Form):
     eventName = StringField('Event Name*', validators=[Required()])
     eventAddress = StringField('Event Address*', validators=[Required()])
     eventCity = StringField('Event City*', validators=[Required()])

     submit = SubmitField('Submit')
     def reset(self):
        self.eventName.data = self.eventAddress.data = self.eventCity.data= ""

class NicknameForm(Form):
    firstName = StringField('First Name*', validators=[Required()])
    lastName = StringField('Last Name*', validators=[Required()])
    artistName = StringField('Artist/Band Name*', validators=[Required()])
    email = StringField('Email*', validators=[Required()]) #include email validation
    password = PasswordField('Password', [
        validators.Required(),
        validators.EqualTo('confirm', message='Passwords must match')
    ])
    confirm = PasswordField('Repeat Password')

    submit = SubmitField('Submit')

    def reset(self):
        self.artistName.data = self.email.data = self.password.data = self.confirm.data = ""


class LoginForm(Form):
    email = StringField('Email*', validators=[Required()]) #include email validation
    password = PasswordField('Password', [validators.Required()])
    remember_me = BooleanField('Remember Me')
    submit = SubmitField('Submit')

    def reset(self):
        self.email.data = self.password.data = ""

@app.errorhandler(401)
def page_not_found(e):
    form = LoginForm()
    flash("Sorry, you have to be logged in to do that")
    return render_template('login.html',form=form), 401

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_server_error(e):
    print(e)
    return render_template('500.html', error=e), 500



@app.route('/', methods=['GET', 'POST'])
def index():
    if current_user.is_authenticated and not current_user.is_anonymous:
        #return redirect("/artists/"+current_user.artist.name)
        client = app.test_client()
        response = client.get('/artists/'+current_user.artist.name, headers=list(request.headers))
        return response
    else:
        form = LoginForm()
        if form.validate_on_submit():
            user = User.query.filter_by(email=form.email.data).first()
            if user is not None and user.verify_password(form.password.data):
                login_user(user, form.remember_me.data)
                #return redirect(request.args.get('next') or url_for('index'))
                return render_template('index.html', form=form)
            flash('Invalid username or password.')
        return render_template('index.html', form=form)

@app.route('/logout/')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.')
    #return render_template('index.html')
    return redirect('/')

@app.route('/register/', methods=['GET', 'POST'])
def register():
    registrationForm=NicknameForm()
    if registrationForm.validate_on_submit():
        artistName = registrationForm.artistName.data
        email = registrationForm.email.data

        artistCheck = Artist.query.filter_by(name=artistName).first()
        ##todo, check that email is unique
        emailCheck = User.query.filter_by(email=email).first()
        if artistCheck is None and emailCheck is None: #this is checking that the artist doesn't yet exist, if it does it will give them an error
            artist = Artist(name=artistName)
            db.session.add(artist)
            db.session.commit()
            user = User(
                first_name=registrationForm.firstName.data,
                last_name=registrationForm.lastName.data,
                email=registrationForm.email.data,
                password = registrationForm.password.data,
                #Random TODO add attribute to artist to say if initialized, won't be public until true
                artist_id = artist.id
            )
            db.session.add(user)
            db.session.commit()
            flash("User successfully added")
            login_user(user)
            return redirect('artists/add/')
        else:
            if emailCheck is not None:
                message = "Error: "+email+ " Has Already Been Registered.  <a href='/login/" + artistName + "'>Login?</a>"
                flash(message,"error") #TODO
                registrationForm.email.data = ""
            if artistCheck is not None:
                message = "Error: "+artistName + " Already Exists.  <a href='/artists/" + artistName + "'>View Page</a>"
                flash(message,"error") #TODO
                registrationForm.artistName.data = ""
    return render_template('register.html', registrationForm=registrationForm)

@app.route('/login/', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user is not None and user.verify_password(form.password.data):
            login_user(user, form.remember_me.data)
            flash("Successfully Logged In")
            #return render_template('index.html', form=form)
            return redirect('/artists/'+current_user.artist.name)
            #return redirect(request.args.get('next') or url_for('index'))
        flash('Invalid username or password.')
    return render_template('login.html', form=form)

@app.route('/tags/')
def tags():
    return render_template('tags.html', tagNames=[tag.name for tag in
                                                  Tag.query.all()])


@app.route('/artists/')
def artists():
    artistNamesImages = zip([artist.name for artist in
                             Artist.query.all()], [artist.image for artist in
                                                   Artist.query.all()])

    return render_template('artists.html', artistNamesImages=sorted(artistNamesImages, key=lambda tup: tup[0]))


@app.route('/artists/<artistName>')
def getArtist(artistName):
    artistObj = Artist.query.join(Tag.artist).filter_by(name=artistName).first()
    if artistObj is None:
        artistObj = Artist.query.filter_by(name=artistName).first() #this is a workaround to fix the fact that our first method of querying will return none if no tags
    if artistObj is None or not artistObj.isInitialized():
        return render_template('artist.html', artistName="null")
    else:
        tracks = Track.query.filter_by(artist_id=artistObj.id).all()
        events = Event.query.filter_by(artist_id=artistObj.id).all()
        return render_template('artist.html', artistName=artistObj.name,
                               artistDescription=artistObj.description,
                               artistImageURL=artistObj.image, tags=artistObj.tags,
                               tracks=tracks, events = events
                               )


@app.route('/tags/<tagName>')
def getTag(tagName):
    tagObj = Tag.query.join(Artist.tags).filter_by(name=tagName).first()
    if tagObj is None:
        tagObj = Tag.query.filter_by(name=tagName).first()
        return render_template('tag.html', tagName=tagObj.name)
    if tagObj is None:
        return render_template('tag.html', tagName="null")
    else:
        return render_template('tag.html', tagName=tagObj.name, artists=tagObj.artists)


@app.route('/uploadedImg/<filename>')
def uploaded_img(filename):
    return send_from_directory(app.config['IMG_FOLDER'],
                               filename)


@app.route('/uploadedTrack/<filename>')
def uploaded_song(filename):
    return send_from_directory(app.config['TRACK_FOLDER'],
                               filename)



@app.route('/artists/add/', methods=['GET', 'POST'])
@login_required
def addArtist():
    artistForm = ArtistForm(srf_enabled=False)
    userArtist = current_user.artist
    if artistForm.validate_on_submit():
        tagsText = artistForm.artistTags.data
        if isinstance(tagsText, str):
            formTags = tagsText.split(", ")

        userArtist.description = artistForm.artistDescription.data
        if artistForm.artistImage.has_file():
            filename = secure_filename(str(uuid.uuid1())+artistForm.artistImage.data.filename)
            artistForm.artistImage.data.save(IMG_FOLDER + filename)
            userArtist.image = filename
        if len(userArtist.image)==0:
            userArtist.image = "no_profile.png"
        for tagName in formTags:
            tag = Tag.query.filter_by(name=tagName).first()
            if tag is None:
                tag = Tag(name=tagName)
            if tag not in userArtist.tags:
                userArtist.tags.append(tag)

        db.session.commit()

        message = "Profile Successfully Modified"
        flash(message, "success")
        return redirect('/artists/'+current_user.artist.name)
    else:
        print("didn't validate")
        if userArtist is not None:
            tags = []
            for tag in userArtist.tags:
                tags.append(tag.name)
            tags = ", ".join(tags)
            artistForm.artistTags.data = tags
            artistForm.artistDescription.data = userArtist.description
    return render_template('form.html', artistForm=artistForm)


@app.route('/getTags/', methods=['GET'])
def getTags():
    tags = [tag.name for tag in Tag.query.all()]
    return Response(json.dumps(tags), mimetype='application/json')


@app.route('/getArtists/', methods=['GET'])
def getArtists():
    artists = [artist.name for artist in Artist.query.all()]
    return Response(json.dumps(artists), mimetype='application/json')


@app.route('/artists/add/tag/', methods=['POST'])
# doesn't render a page, only used for AJAX post
def addTag():
    jsonData = request.json
    newTag = jsonData.get('newTag')
    newTag = Tag.query.filter_by(name=newTag).first()
    if newTag is None:
        newTag = jsonData.get('newTag')
        tag = Tag(name=newTag)
        db.session.add(tag)
        db.session.commit()
        newTagID = Tag.query.filter_by(name=newTag).first().id
        # send back success message to js with new tag ID
        return json.dumps({'success': True, 'tag_id': newTagID}), 200, {'ContentType': 'application/json'}
    else:
        # -1 means duplicate tag
        return json.dumps({'success': True, 'tag_id': -1}), 200, {'ContentType': 'application/json'}

@app.route('/events/add/', methods=['GET', 'POST'])
@login_required
def addEvent():
    userArtist = current_user.artist
    eventForm = EventForm(csrf_enabled=False)
    if eventForm.validate_on_submit():
        event = Event(
            name=eventForm.eventName.data,
            artist_id=userArtist.id,
            address = eventForm.eventAddress.data,
            city = eventForm.eventCity.data
        )
        db.session.add(event)
        db.session.commit
        message = event.name + " Successfully Added to " + userArtist.name + ".  <a href='/artists/" + userArtist.name + "'>View Page</a>"
        flash(message, "success")
    return render_template('addEvent.html', eventForm=eventForm);

@app.route('/tracks/add/', methods=['GET', 'POST'])
@login_required
def addTrack():
    #print(session['artistname'])
    trackForm = TrackForm(csrf_enabled=False)
    artistName = current_user.artist.name
    trackTags = trackForm.trackTags.data
    if isinstance(trackTags, str):
        trackTags = trackTags.split(", ")
    if trackForm.validate_on_submit():
        userArtist = current_user.artist
        if userArtist is None:
            print("This shouldn't happen, should only have access if logged in")
            message = "Error: " + userArtist.name + " Does Not Exists."
            flash(message, "error")
            return render_template('form.html', trackForm=trackForm)
        else:
            filename = secure_filename(str(uuid.uuid1())+trackForm.trackURL.data.filename)
            track = Track(
                name=trackForm.trackName.data,
                artist_id=userArtist.id,
                url=filename
            )
            trackForm.trackURL.data.save(TRACK_FOLDER + filename)

        for tagName in trackTags:
            tag = Tag.query.filter_by(name=tagName).first()
            if tag is None:
                tag = Tag(name=tagName)
            track.tags.append(tag)
            db.session.add(track)
            db.session.commit()

        message = track.name + " Successfully Added to " + userArtist.name + ".  <a href='/artists/" + userArtist.name + "'>View Page</a>"
        flash(message, "success")
    return render_template('addTrack.html', trackForm=trackForm)
'''

if __name__ == '__main__':
    manager.add_command("runserver", Server(
        use_debugger=True,
        use_reloader=True,
        host='0.0.0.0'))

    manager.run()  # had no params before 4/25/16
