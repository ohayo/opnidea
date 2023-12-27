export default function MessagePreview(props) {
    return (
        <div className="message-preview" onClick={() => window.location.href = `/messages/${props.id}`} style={props.marker_text ? { '--marker-text': `'${props.marker_text}'` } : {}}>
            <h1>{props.username} {props.verified ? <span className="badge">VERIFIED</span> : <></>}</h1>
            <h3>On {new Date(props.date).toLocaleString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: 'numeric' })}</h3>
            <h2>{props.last_message}</h2>
        </div>
    )
}