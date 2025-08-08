import styles from './Input.module.css';

function Input({type, placeholder, text, name, handleOnChange, value}) {
    return(
        <div className={styles.form_control}>
            <label htmlFor={name}>{text}:</label>
            <input 
                type={type} 
                name={name} 
                id={name} 
                onChange={handleOnChange} 
                value={value} 
                placeholder={placeholder} 
            />
        </div>
    )
}

export default Input;
