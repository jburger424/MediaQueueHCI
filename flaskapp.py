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
from wtforms import StringField, SubmitField
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.login import LoginManager, UserMixin, AnonymousUserMixin, login_required, login_user, logout_user, \
    current_user

#TODO: Make seperate distinct pages for create station join station
#TODO: JS to send server when video starts and ends so now playing and video history can update on update
#TODO: URL/Query switching button on input bar
#TODO: mobile format, large sticky search bar at bottom, possibly desktop too
#TODO:Clean up code thoroughly

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
app.config['SECRET_KEY'] = 'hard to guess string'
app.config['SQLALCHEMY_DATABASE_URI'] = \
    'sqlite:///' + os.path.join(basedir, 'data.sqlite')
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
    state = db.Column(db.String(256), unique=False)
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
                                thumb_url=thumb_url,
                                state="unplayed"
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

@app.route('/session/state', methods=['POST'])
def update_state():
    print("State Change")
    #states: unplayed, playing, played
    jsonData = request.json
    playable_url = jsonData.get('playable_url')
    state = jsonData.get('state')
    playable = Playable.query.filter(
        current_user.session_id == Playable.session_id,
        Playable.url == playable_url
    ).first()
    playable.state = state
    playable.time_modified = datetime.utcnow()
    return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}

#will run program on 0.0.0.0 computer's local ip address
if __name__ == '__main__':
    manager.add_command("runserver", Server(
        use_debugger=True,
        use_reloader=True,
        host='0.0.0.0'))

    manager.run()  # had no params before 4/25/16
