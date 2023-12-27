import '../css/alert.css'

export default function Alert(props) {
    return (
        <>
            <div className='alert-wrapper'>
                <div id="alert" className={props.warning ? 'bad-notif' : ''}>
                        {props.message}
                </div>
            </div>
        </>
    )
}