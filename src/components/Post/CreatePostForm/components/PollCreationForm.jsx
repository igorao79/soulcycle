import React from 'react';
import { FiPlus, FiMinus } from 'react-icons/fi';
import styles from '../../Post.module.scss';

const PollCreationForm = ({ 
  pollOptions, 
  setPollOptions, 
  isSubmitting,
  selectedFont,
  pollOptionsColor
}) => {
  // Handle adding a new poll option
  const handleAddPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };
  
  // Handle removing a poll option
  const handleRemovePollOption = (index) => {
    if (pollOptions.length > 2) {
      const newOptions = [...pollOptions];
      newOptions.splice(index, 1);
      setPollOptions(newOptions);
    }
  };
  
  // Handle poll option change
  const handlePollOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  return (
    <div className={styles.pollContainer}>
      <div className={styles.pollOptions}>
        {pollOptions.map((option, index) => (
          <div key={index} className={styles.pollOption}>
            <div className={styles.pollOptionInputWrapper}>
              <input
                type="text"
                className={styles.pollOptionInput}
                value={option}
                onChange={(e) => handlePollOptionChange(index, e.target.value)}
                placeholder={`Вариант ${index + 1}`}
                disabled={isSubmitting}
                style={{ color: pollOptionsColor, fontFamily: selectedFont }}
              />
              {pollOptions.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemovePollOption(index)}
                  className={styles.removeOptionButton}
                  disabled={isSubmitting}
                >
                  <FiMinus />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <button
        type="button"
        onClick={handleAddPollOption}
        className={styles.addOptionButton}
        disabled={isSubmitting || pollOptions.length >= 6}
      >
        <FiPlus /> Добавить вариант
      </button>
    </div>
  );
};

export default PollCreationForm; 