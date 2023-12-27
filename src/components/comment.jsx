import '../css/comments.css';
import { Link } from 'react-router-dom';
import React from 'react';

export default function Comment(props) {
  const commentWords = props.props.content.split(' ');

  return (
    <div className='comment'>
      <h1>
        <Link to={`/profiles/${props.props.author.id}`} className='mention'>@{props.props.author.username}</Link>: "{commentWords.length > 0 ? (
          commentWords.map((word, index) => (
            <React.Fragment key={index}>
              {word.startsWith("@") ? (
                props.props.mentioned_users.find(mentionedUser => mentionedUser.username.toLowerCase() === word.replace("@", "").toLowerCase()) ? (
                  <Link to={`/profiles/${props.props.mentioned_users.find(mentionedUser => mentionedUser.username.toLowerCase() === word.replace("@", "").toLowerCase()).id}`} className='mention'>@{word.replace("@", "").toLowerCase()}</Link>
                ) : (
                  word
                )
              ) : (
                word
              )}
              {index < commentWords.length - 1 && ' '}
            </React.Fragment>
          ))
        ) : props.props.content}"
      </h1>
      <span>On {new Date(props.props.date).toLocaleString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: 'numeric' })}</span>
    </div>
  );
}