import localFont from 'next/font/local';

export const IBMPlexSans = localFont({
    src: [
        {
            path: '../../../public/IBMPlexSans-Regular.woff2',
            weight: '400',
            style: 'normal',
        },
        {
            path: '../../../public/IBMPlexSans-Italic.woff2',
            weight: '400',
            style: 'italic',
        },
        {
            path: '../../../public/IBMPlexSans-Bold.woff2',
            weight: '700',
            style: 'normal',
        },
        {
            path: '../../../public/IBMPlexSans-BoldItalic.woff2',
            weight: '700',
            style: 'italic',
        },
    ],
    variable: '--font-sans',
});

export const IBMPlexMono = localFont({
    src: [
        {
            path: '../../../public/IBMPlexMono-Regular.woff2',
            weight: '400',
            style: 'normal',
        },
        {
            path: '../../../public/IBMPlexMono-Bold.woff2',
            weight: '700',
            style: 'normal',
        },
        {
            path: '../../../public/IBMPlexMono-BoldItalic.woff2',
            weight: '700',
            style: 'italic',
        },
        {
            path: '../../../public/IBMPlexMono-Light.woff2',
            weight: '300',
            style: 'normal',
        },
    ],
    variable: '--font-mono',
});

export const IBMPlexSerif = localFont({
    src: [
        {
            path: '../../../public/IBMPlexSerif-Regular.woff2',
            weight: '400',
            style: 'normal',
        },
        {
            path: '../../../public/IBMPlexSerif-Italic.woff2',
            weight: '400',
            style: 'italic',
        },
        {
            path: '../../../public/IBMPlexSerif-Bold.woff2',
            weight: '700',
            style: 'normal',
        },
        {
            path: '../../../public/IBMPlexSerif-BoldItalic.woff2',
            weight: '700',
            style: 'italic',
        },
    ],
    variable: '--font-serif',
});
