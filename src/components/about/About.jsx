import React from 'react';
import styles from '../../styles/about/About.module.scss';
import BookMember from './BookMember';
import Tgbtn from '../charblock/window/Tgbtn';
import DeveloperMember from './DeveloperMember';
import { motion } from 'framer-motion';

function About() {
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };
    
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    return (
        <motion.div 
            className={styles.aboutblock}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <header className={styles.aboutblock__header}>
                <motion.h2 
                    className={styles.aboutblock__header__htitle}
                    variants={cardVariants}
                >
                    О нашей книге
                </motion.h2>
                <motion.div 
                    className={styles.aboutblock__header__textblock}
                    variants={containerVariants}
                >
                    <motion.div className={styles.aboutblock__header__textblock__card} variants={cardVariants}>
                        <div className={styles.aboutblock__header__textblock__card__icon}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 122.9 108.7"
                                width="50"
                                height="50"
                            >
                                <path
                                    className={styles.aboutblock__header__textblock__card__icon__main}
                                    d="M95.2 91.4h-.8a1.6 1.6 0 0 1-1.6-1.7 23 23 0 0 0-1.9-9 27 27 0 0 0-13.4-13.5 23 23 0 0 0-9.1-1.8a1.6 1.6 0 0 1-1.6-1.7V63a1.6 1.6 0 0 1 1.6-1.7 22.9 22.9 0 0 0 9.1-1.8 25.4 25.4 0 0 0 8-5.5 25.6 25.6 0 0 0 5.4-7.9 22.9 22.9 0 0 0 1.8-9.1 1.6 1.6 0 0 1 1.7-1.6h.8a1.6 1.6 0 0 1 1.7 1.6 22.9 22.9 0 0 0 1.8 9.1 25.2 25.2 0 0 0 5.5 8 25.2 25.2 0 0 0 8 5.4 22.9 22.9 0 0 0 9 1.8A1.6 1.6 0 0 1 123 63v.8a1.6 1.6 0 0 1-1.7 1.7 23 23 0 0 0-9 1.8 27 27 0 0 0-13.5 13.4 23 23 0 0 0-1.8 9.1 1.6 1.6 0 0 1-1.7 1.7Z"
                                />
                                <path
                                    className={styles.aboutblock__header__textblock__card__icon__small}
                                    d="M65,55h-0.7a1,1,0,0,1-1-1,15,15,0,0,0-1.2-6,18,18,0,0,0-4.3-5.6,18,18,0,0,0-5.6-4.3,15,15,0,0,0-6-1.2,1,1,0,0,1-1-1V35a1,1,0,0,1,1-1,15,15,0,0,0,6-1.2,18,18,0,0,0,5.6-4.3,18,18,0,0,0,4.3-5.6,15,15,0,0,0,1.2-6,1,1,0,0,1,1-1H65a1,1,0,0,1,1,1,15,15,0,0,0,1.2,6,18,18,0,0,0,4.3,5.6,18,18,0,0,0,5.6,4.3,15,15,0,0,0,6,1.2,1,1,0,0,1,1,1v0.7a1,1,0,0,1-1,1,15,15,0,0,0-6,1.2,18,18,0,0,0-5.6,4.3,18,18,0,0,0-4.3,5.6,15,15,0,0,0-1.2,6,1,1,0,0,1-1,1Z"
                                    transform="scale(0.5) translate(90,70)"
                                />
                            </svg>
                        </div>
                        <div className={styles.aboutblock__header__textblock__card__content}>
                            <p>Основной жанр нашей книги - фэнтэзи с элементами дарк фэнтэзи, романтики и приключений</p>
                        </div>
                    </motion.div>

                    <motion.div className={styles.aboutblock__header__textblock__card} variants={cardVariants}>
                        <div className={styles.aboutblock__header__textblock__card__icon}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 108.69" width="50" height="50">
                                <path className={styles.aboutblock__header__textblock__card__icon__main} d="M95.24,91.38H94.4a1.65,1.65,0,0,1-1.65-1.65,22.91,22.91,0,0,0-1.81-9.12A27.06,27.06,0,0,0,77.52,67.19a23.05,23.05,0,0,0-9.12-1.81,1.65,1.65,0,0,1-1.64-1.64v-.85a1.64,1.64,0,0,1,1.64-1.64,22.88,22.88,0,0,0,9.12-1.82,25.35,25.35,0,0,0,7.93-5.49A25.62,25.62,0,0,0,90.94,46a22.87,22.87,0,0,0,1.81-9.11,1.65,1.65,0,0,1,1.65-1.64h.84a1.65,1.65,0,0,1,1.65,1.64A22.88,22.88,0,0,0,98.7,46a25.24,25.24,0,0,0,5.49,7.93,25.19,25.19,0,0,0,7.93,5.49,22.88,22.88,0,0,0,9.12,1.82,1.64,1.64,0,0,1,1.64,1.64v.85a1.65,1.65,0,0,1-1.64,1.64,23.05,23.05,0,0,0-9.12,1.81A27.06,27.06,0,0,0,98.7,80.61a23,23,0,0,0-1.81,9.12,1.65,1.65,0,0,1-1.65,1.65Z"/>
                                <path className={styles.aboutblock__header__textblock__card__icon__small} d="M65,55h-0.7a1,1,0,0,1-1-1,15,15,0,0,0-1.2-6,18,18,0,0,0-4.3-5.6,18,18,0,0,0-5.6-4.3,15,15,0,0,0-6-1.2,1,1,0,0,1-1-1V35a1,1,0,0,1,1-1,15,15,0,0,0,6-1.2,18,18,0,0,0,5.6-4.3,18,18,0,0,0,4.3-5.6,15,15,0,0,0,1.2-6,1,1,0,0,1,1-1H65a1,1,0,0,1,1,1,15,15,0,0,0,1.2,6,18,18,0,0,0,4.3,5.6,18,18,0,0,0,5.6,4.3,15,15,0,0,0,6,1.2,1,1,0,0,1,1,1v0.7a1,1,0,0,1-1,1,15,15,0,0,0-6,1.2,18,18,0,0,0-5.6,4.3,18,18,0,0,0-4.3,5.6,15,15,0,0,0-1.2,6,1,1,0,0,1-1,1Z" 
                                transform="scale(0.5) translate(90,70)"/>
                            </svg>
                        </div>
                        <div className={styles.aboutblock__header__textblock__card__content}>
                            <p>Книга была создана 27 июня 2024 года — совершенно спонтанно, без чётких целей. За её развитием вы можете следить <a href="https://t.me/+yFsUa_nD88piNjg6" className={styles.aboutblock__header__textblock__card__link}>здесь</a></p>
                        </div>
                    </motion.div>

                    <motion.div className={styles.aboutblock__header__textblock__card} variants={cardVariants}>
                        <div className={styles.aboutblock__header__textblock__card__icon}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 108.69" width="50" height="50">
                                <path className={styles.aboutblock__header__textblock__card__icon__main} d="M95.24,91.38H94.4a1.65,1.65,0,0,1-1.65-1.65,22.91,22.91,0,0,0-1.81-9.12A27.06,27.06,0,0,0,77.52,67.19a23.05,23.05,0,0,0-9.12-1.81,1.65,1.65,0,0,1-1.64-1.64v-.85a1.64,1.64,0,0,1,1.64-1.64,22.88,22.88,0,0,0,9.12-1.82,25.35,25.35,0,0,0,7.93-5.49A25.62,25.62,0,0,0,90.94,46a22.87,22.87,0,0,0,1.81-9.11,1.65,1.65,0,0,1,1.65-1.64h.84a1.65,1.65,0,0,1,1.65,1.64A22.88,22.88,0,0,0,98.7,46a25.24,25.24,0,0,0,5.49,7.93,25.19,25.19,0,0,0,7.93,5.49,22.88,22.88,0,0,0,9.12,1.82,1.64,1.64,0,0,1,1.64,1.64v.85a1.65,1.65,0,0,1-1.64,1.64,23.05,23.05,0,0,0-9.12,1.81A27.06,27.06,0,0,0,98.7,80.61a23,23,0,0,0-1.81,9.12,1.65,1.65,0,0,1-1.65,1.65Z"/>
                                <path className={styles.aboutblock__header__textblock__card__icon__small} d="M65,55h-0.7a1,1,0,0,1-1-1,15,15,0,0,0-1.2-6,18,18,0,0,0-4.3-5.6,18,18,0,0,0-5.6-4.3,15,15,0,0,0-6-1.2,1,1,0,0,1-1-1V35a1,1,0,0,1,1-1,15,15,0,0,0,6-1.2,18,18,0,0,0,5.6-4.3,18,18,0,0,0,4.3-5.6,15,15,0,0,0,1.2-6,1,1,0,0,1,1-1H65a1,1,0,0,1,1,1,15,15,0,0,0,1.2,6,18,18,0,0,0,4.3,5.6,18,18,0,0,0,5.6,4.3,15,15,0,0,0,6,1.2,1,1,0,0,1,1,1v0.7a1,1,0,0,1-1,1,15,15,0,0,0-6,1.2,18,18,0,0,0-5.6,4.3,18,18,0,0,0-4.3,5.6,15,15,0,0,0-1.2,6,1,1,0,0,1-1,1Z"
                                transform="scale(0.5) translate(90,70)"/>
                            </svg>
                        </div>
                        <div className={styles.aboutblock__header__textblock__card__content}>
                            <p>Наша книга - это погружение в мир магии, загадочных созданий и невероятных приключений. Присоединяйтесь к нашему творческому путешествию!</p>
                        </div>
                    </motion.div>
                </motion.div>
            </header>

            <div className={styles.aboutblock__divider}>
                <div className={styles.aboutblock__divider__line}></div>
                <div className={styles.aboutblock__divider__icon}>✧</div>
                <div className={styles.aboutblock__divider__line}></div>
            </div>

            <motion.div 
                className={styles.aboutblock__main}
                variants={containerVariants}
            >
                <motion.h2 
                    className={styles.aboutblock__main__btitle}
                    variants={cardVariants}
                >
                    Творческая команда
                </motion.h2>
                <motion.div 
                    className={styles.aboutblock__main__authors}
                    variants={containerVariants}
                >
                    <motion.div variants={cardVariants}>
                        <BookMember 
                            memberId="igor" 
                            profileUrl="http://localhost:5173/#/profile/ca7fe23e-f263-4372-8aac-a652791e724c"
                        />
                    </motion.div>
                    <motion.div variants={cardVariants}>
                        <BookMember 
                            memberId="lesya" 
                            profileUrl="http://localhost:5173/#/profile/f1ea0167-4743-4d9e-93fc-42e30a55f34f"
                        />
                    </motion.div>
                </motion.div>
                
                <motion.h2 
                    className={styles.aboutblock__main__dtitle}
                    variants={cardVariants}
                >
                    Команда разработки
                </motion.h2>
                <motion.div 
                    className={styles.aboutblock__main__developers}
                    variants={containerVariants}
                >
                    <motion.div variants={cardVariants}>
                        <DeveloperMember 
                            memberId="igor" 
                            profileUrl="http://localhost:5173/#/profile/ca7fe23e-f263-4372-8aac-a652791e724c"
                        />
                    </motion.div>
                </motion.div>
            </motion.div>
            
            <motion.div 
                className={styles.aboutblock__social}
                variants={containerVariants}
            >
                <motion.h2 
                    className={styles.aboutblock__social__title}
                    variants={cardVariants}
                >
                    Присоединяйтесь к нам
                </motion.h2>
                <motion.div 
                    className={styles.aboutblock__social__links}
                    variants={cardVariants}
                >
                    <Tgbtn />
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

export default About;