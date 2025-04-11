import React from 'react';
import styles from '../../styles/about/About.module.scss';
import BookMember from './BookMember';
import Tgbtn from '../charblock/window/Tgbtn'
import DeveloperMember from './DeveloperMember';


function About() {
    return (
        <div className={styles.aboutblock}>
            <header className={styles.aboutblock__header}>
                <h2 className={styles.aboutblock__header__htitle}>О нашей книге</h2>
                <div className={styles.aboutblock__header__textblock}>
                    <div className={styles.aboutblock__header__textblock__text}>
                        <svg
                        className={styles.aboutblock__header__textblock__text__icon}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 122.9 108.7"
                        width="50"
                        height="50"
                        >
                        <path
                          className={styles.aboutblock__header__textblock__text__icon__main}
                          d="M95.2 91.4h-.8a1.6 1.6 0 0 1-1.6-1.7 23 23 0 0 0-1.9-9 27 27 0 0 0-13.4-13.5 23 23 0 0 0-9.1-1.8 1.6 1.6 0 0 1-1.6-1.7V63a1.6 1.6 0 0 1 1.6-1.7 22.9 22.9 0 0 0 9.1-1.8 25.4 25.4 0 0 0 8-5.5 25.6 25.6 0 0 0 5.4-7.9 22.9 22.9 0 0 0 1.8-9.1 1.6 1.6 0 0 1 1.7-1.6h.8a1.6 1.6 0 0 1 1.7 1.6 22.9 22.9 0 0 0 1.8 9.1 25.2 25.2 0 0 0 5.5 8 25.2 25.2 0 0 0 8 5.4 22.9 22.9 0 0 0 9 1.8A1.6 1.6 0 0 1 123 63v.8a1.6 1.6 0 0 1-1.7 1.7 23 23 0 0 0-9 1.8 27 27 0 0 0-13.5 13.4 23 23 0 0 0-1.8 9.1 1.6 1.6 0 0 1-1.7 1.7Z"
                        />
                        <path
                          className={styles.aboutblock__header__textblock__text__icon__small}
                          d="M62 50h-.3a.4.4 0 0 1-.4-.4 6 6 0 0 0-.5-2.4 7.2 7.2 0 0 0-1.7-2.2 7.2 7.2 0 0 0-2.2-1.8 6 6 0 0 0-2.4-.4.4.4 0 0 1-.4-.4V42a.4.4 0 0 1 .4-.4 6 6 0 0 0 2.4-.5 7.2 7.2 0 0 0 2.2-1.7 7.2 7.2 0 0 0 1.7-2.2 6 6 0 0 0 .5-2.4.4.4 0 0 1 .4-.4h.3a.4.4 0 0 1 .4.4 6 6 0 0 0 .5 2.4 7.2 7.2 0 0 0 1.7 2.2 7.2 7.2 0 0 0 2.2 1.7 6 6 0 0 0 2.4.5.4.4 0 0 1 .4.4v.3a.4.4 0 0 1-.4.4 6 6 0 0 0-2.4.5 7.2 7.2 0 0 0-2.2 1.7 7.2 7.2 0 0 0-1.7 2.2 6 6 0 0 0-.5 2.4.4.4 0 0 1-.4.4Z"
                        />
                        </svg>
                        <p>Основной жанр нашей книги - фэнтэзи с элементами дарк фэнтэзи, романтики и приключений</p>
                    </div>
                    <div className={styles.aboutblock__header__textblock__text}>
                        <svg className={styles.aboutblock__header__textblock__text__icon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 108.69" width="50" height="50">
                            <path className={styles.aboutblock__header__textblock__text__icon__main} d="M95.24,91.38H94.4a1.65,1.65,0,0,1-1.65-1.65,22.91,22.91,0,0,0-1.81-9.12A27.06,27.06,0,0,0,77.52,67.19a23.05,23.05,0,0,0-9.12-1.81,1.65,1.65,0,0,1-1.64-1.64v-.85a1.64,1.64,0,0,1,1.64-1.64,22.88,22.88,0,0,0,9.12-1.82,25.35,25.35,0,0,0,7.93-5.49A25.62,25.62,0,0,0,90.94,46a22.87,22.87,0,0,0,1.81-9.11,1.65,1.65,0,0,1,1.65-1.64h.84a1.65,1.65,0,0,1,1.65,1.64A22.88,22.88,0,0,0,98.7,46a25.24,25.24,0,0,0,5.49,7.93,25.19,25.19,0,0,0,7.93,5.49,22.88,22.88,0,0,0,9.12,1.82,1.64,1.64,0,0,1,1.64,1.64v.85a1.65,1.65,0,0,1-1.64,1.64,23.05,23.05,0,0,0-9.12,1.81A27.06,27.06,0,0,0,98.7,80.61a23,23,0,0,0-1.81,9.12,1.65,1.65,0,0,1-1.65,1.65Z"/>
                            <path className={styles.aboutblock__header__textblock__text__icon__small} d="M65,55h-0.7a1,1,0,0,1-1-1,15,15,0,0,0-1.2-6,18,18,0,0,0-4.3-5.6,18,18,0,0,0-5.6-4.3,15,15,0,0,0-6-1.2,1,1,0,0,1-1-1V35a1,1,0,0,1,1-1,15,15,0,0,0,6-1.2,18,18,0,0,0,5.6-4.3,18,18,0,0,0,4.3-5.6,15,15,0,0,0,1.2-6,1,1,0,0,1,1-1H65a1,1,0,0,1,1,1,15,15,0,0,0,1.2,6,18,18,0,0,0,4.3,5.6,18,18,0,0,0,5.6,4.3,15,15,0,0,0,6,1.2,1,1,0,0,1,1,1v0.7a1,1,0,0,1-1,1,15,15,0,0,0-6,1.2,18,18,0,0,0-5.6,4.3,18,18,0,0,0-4.3,5.6,15,15,0,0,0-1.2,6,1,1,0,0,1-1,1Z" fill="black" transform="scale(0.4) translate(90,70)"/>
                        </svg>
                        <p>Книга была создана 27 июня 2024 года — совершенно спонтанно, без чётких целей. За её развитием вы можете следить <a href="https://t.me/+yFsUa_nD88piNjg6">здесь</a></p>
                    </div>
                    <div className={styles.aboutblock__header__textblock__text}>
                        <svg className={styles.aboutblock__header__textblock__text__icon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 108.69" width="50" height="50">
                            <path className={styles.aboutblock__header__textblock__text__icon__main} d="M95.24,91.38H94.4a1.65,1.65,0,0,1-1.65-1.65,22.91,22.91,0,0,0-1.81-9.12A27.06,27.06,0,0,0,77.52,67.19a23.05,23.05,0,0,0-9.12-1.81,1.65,1.65,0,0,1-1.64-1.64v-.85a1.64,1.64,0,0,1,1.64-1.64,22.88,22.88,0,0,0,9.12-1.82,25.35,25.35,0,0,0,7.93-5.49A25.62,25.62,0,0,0,90.94,46a22.87,22.87,0,0,0,1.81-9.11,1.65,1.65,0,0,1,1.65-1.64h.84a1.65,1.65,0,0,1,1.65,1.64A22.88,22.88,0,0,0,98.7,46a25.24,25.24,0,0,0,5.49,7.93,25.19,25.19,0,0,0,7.93,5.49,22.88,22.88,0,0,0,9.12,1.82,1.64,1.64,0,0,1,1.64,1.64v.85a1.65,1.65,0,0,1-1.64,1.64,23.05,23.05,0,0,0-9.12,1.81A27.06,27.06,0,0,0,98.7,80.61a23,23,0,0,0-1.81,9.12,1.65,1.65,0,0,1-1.65,1.65Z"/>
                            <path className={styles.aboutblock__header__textblock__text__icon__small} d="M65,55h-0.7a1,1,0,0,1-1-1,15,15,0,0,0-1.2-6,18,18,0,0,0-4.3-5.6,18,18,0,0,0-5.6-4.3,15,15,0,0,0-6-1.2,1,1,0,0,1-1-1V35a1,1,0,0,1,1-1,15,15,0,0,0,6-1.2,18,18,0,0,0,5.6-4.3,18,18,0,0,0,4.3-5.6,15,15,0,0,0,1.2-6,1,1,0,0,1,1-1H65a1,1,0,0,1,1,1,15,15,0,0,0,1.2,6,18,18,0,0,0,4.3,5.6,18,18,0,0,0,5.6,4.3,15,15,0,0,0,6,1.2,1,1,0,0,1,1,1v0.7a1,1,0,0,1-1,1,15,15,0,0,0-6,1.2,18,18,0,0,0-5.6,4.3,18,18,0,0,0-4.3,5.6,15,15,0,0,0-1.2,6,1,1,0,0,1-1,1Z" fill="black" transform="scale(0.4) translate(90,70)"/>
                        </svg>
                        <p>adsada</p>
                    </div>
                    <div className={styles.aboutblock__header__textblock__text}>
                        <Tgbtn />
                    </div>
                </div>
            </header>
            <div className={styles.aboutblock__main}>
                <h2 className={styles.aboutblock__main__btitle}>Творческая команда</h2>
                <div className={styles.aboutblock__main__authors}>
                    <BookMember memberId="igor" />
                    <BookMember memberId="lesya" />
                </div>
                <h2 className={styles.aboutblock__main__dtitle}>Команда разработки</h2>
                <div className={styles.aboutblock__main__developers}>
                    <DeveloperMember memberId="igor" />
                </div>
            </div>
        </div>
    )
}

export default About