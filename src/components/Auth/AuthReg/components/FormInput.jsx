import React from 'react';
import { motion } from 'framer-motion';
import { inputVariants, fieldVariants } from '../config/animations';
import styles from '../../AuthForms.module.scss';

/**
 * Компонент поля ввода с иконкой и анимацией
 */
const FormInput = ({
  id,
  type = 'text',
  value,
  onChange,
  disabled,
  placeholder,
  icon: Icon,
  label,
  maxLength,
  required = false,
  showCharCounter = false,
  autoComplete
}) => {
  return (
    <motion.div className={styles.formGroup} variants={fieldVariants}>
      <label htmlFor={id}>
        <Icon className={styles.inputIcon} /> {label}
      </label>
      <motion.div
        whileFocus="focus"
        whileTap="focus" 
        variants={inputVariants}
      >
        <div className={styles.inputWrapper}>
          <Icon className={styles.inputIconInside} />
          <input
            type={type}
            id={id}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            required={required}
            maxLength={maxLength}
            autoComplete={autoComplete}
          />
        </div>
      </motion.div>
      
      {showCharCounter && maxLength && (
        <small className={styles.charCounter}>
          {value.length}/{maxLength} символов
        </small>
      )}
    </motion.div>
  );
};

export default FormInput; 