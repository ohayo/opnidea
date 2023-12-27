import '../css/messages.css';

export default function Message(props) {
    return (
        <div className="message">
            <p className={props.profile_id == props.id || props.id == "0" ? 'message-from-them' : 'message-from-us'} style={{'--message-timestamp': `'${props.time}'`}}>{props.content}</p>
        </div>
    )
}