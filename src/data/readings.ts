import { Reading } from '@/types/reading';

export const readingsData: Reading[] = [
  {
    id: '1',
    slug: 'sholawat-wahidiyah',
    title: 'Sholawat Wahidiyah',
    description: 'Rangkaian sholawat dan doa untuk menjernihkan hati, menentramkan jiwa, serta mendekatkan diri kepada Allah SWT.',
    category: 'Sholawat',
    estimatedTime: '10-15 Menit',
    sections: [
      {
        id: 'sw-1',
        title: 'Hadiah Fatihah (Illa Hadhroti...)',
        arabic: 'إِلَى حَضْرَةِ النَّبِيِّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ وَآلِهِ، الْفَاتِحَة',
        transliteration: 'Ilaa hadhrotin-nabiyyi shallallaahu \'alaihi wa sallama wa aalihi, Al-Fatihah...',
        translation: 'Kepada pangkuan Beliau Agung Nabi Muhammad SAW dan keluarga Beliau, Al-Fatihah...',
        instruction: 'Membaca Surat Al-Fatihah 1 kali'
      },
      {
        id: 'sw-2',
        title: 'Fafirruu Ilallah',
        arabic: 'فَفِرُّوا إِلَى اللَّهِ',
        transliteration: 'Fafirruu ilallaah',
        translation: 'Maka berlarilah kembali kamu sekalian kepada Allah.',
        instruction: 'Dibaca dengan khusyuk',
        repeatCount: 100
      },
      {
        id: 'sw-3',
        title: 'Waqul Cja-al Haqqu...',
        arabic: 'وَقُلْ جَاءَ الْحَقُّ وَزَهَقَ الْبَاطِلُ إِنَّ الْبَاطِلَ كَانَ زَهُوقًا',
        transliteration: 'Wa qul jaa-al haqqu wa zahaqal baathilu innal baathila kaana zahuuqaa',
        translation: 'Dan katakanlah: Yang benar telah datang dan yang bathil telah lenyap. Sesungguhnya yang bathil itu adalah sesuatu yang pasti lenyap.',
        repeatCount: 1
      },
      {
        id: 'sw-4',
        title: 'Yaa Sayyidii Yaa Rosuulallah',
        arabic: 'يَا سَيِّدِي يَا رَسُولَ اللَّهِ',
        transliteration: 'Yaa Sayyidii Yaa Rosuulallah',
        translation: 'Duhai Pemimpin kami, duhai Utusan Allah.',
        repeatCount: 100
      }
    ]
  },
  {
    id: '2',
    slug: 'al-fatihah',
    title: 'Al-Fatihah',
    description: 'Surat pembuka Al-Qur\'an yang mengandung puji-pujian, pengakuan keesaan Allah, dan permohonan petunjuk jalan yang lurus.',
    category: 'Al-Fatihah',
    estimatedTime: '2-3 Menit',
    sections: [
      {
        id: 'af-1',
        title: 'Ayat 1',
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        transliteration: 'Bismillaahir-rohmaanir-rohiim',
        translation: 'Dengan menyebut nama Allah Yang Maha Pengasih lagi Maha Penyayang.'
      },
      {
        id: 'af-2',
        title: 'Ayat 2',
        arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
        transliteration: 'Al-hamdu lillaahi robbil-\'aalamiin',
        translation: 'Segala puji bagi Allah, Tuhan semesta alam.'
      },
      {
        id: 'af-3',
        title: 'Ayat 3',
        arabic: 'الرَّحْمَٰنِ الرَّحِيمِ',
        transliteration: 'Ar-rohmaanir-rohiim',
        translation: 'Maha Pengasih lagi Maha Penyayang.'
      },
      {
        id: 'af-4',
        title: 'Ayat 4',
        arabic: 'مَالِكِ يَوْمِ الدِّينِ',
        transliteration: 'Maaliki yaumid-diin',
        translation: 'Yang menguasai hari pembalasan.'
      },
      {
        id: 'af-5',
        title: 'Ayat 5',
        arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
        transliteration: 'Iyyaaka na\'budu wa iyyaaka nasta\'iin',
        translation: 'Hanya kepada Engkaulah kami menyembah dan hanya kepada Engkaulah kami mohon pertolongan.'
      },
      {
        id: 'af-6',
        title: 'Ayat 6',
        arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
        transliteration: 'Ihdinas-shirootal-mustaqiim',
        translation: 'Tunjukkanlah kami jalan yang lurus.'
      },
      {
        id: 'af-7',
        title: 'Ayat 7',
        arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
        transliteration: 'Shirootol-ladziina an\'amta \'alaihim ghoiril-maghdhuubi \'alaihim wa lad-dhoolliin',
        translation: '(yaitu) jalan orang-orang yang telah Engkau beri nikmat kepadanya; bukan (jalan) mereka yang dimurkai, dan bukan (pula jalan) mereka yang sesat.'
      }
    ]
  },
  {
    id: '3',
    slug: 'dzikir',
    title: 'Dzikir Pagi & Petang',
    description: 'Kalimat thoyyibah dan dzikir perlindungan harian untuk melapangkan dada dan memohon keselamatan.',
    category: 'Dzikir',
    estimatedTime: '5-10 Menit',
    sections: [
      {
        id: 'dz-1',
        title: 'Ayat Kursi',
        arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ...',
        transliteration: 'Allaahu laa ilaaha illaa huwal-hayyul-qoyyuum. Laa ta\'khudzuhu sinatuw-wa laa naum...',
        translation: 'Allah, tidak ada tuhan selain Dia Yang Maha Hidup, yang terus-menerus mengurus (makhluk-Nya)...',
        repeatCount: 1
      },
      {
        id: 'dz-2',
        title: 'Tasbih, Tahmid, Takbir',
        arabic: 'سُبْحَانَ اللَّهِ ، وَالْحَمْدُ لِلَّهِ ، وَاللَّهُ أَكْبَرُ',
        transliteration: 'Subhaanallah, Walhamdulillah, Wallahu Akbar',
        translation: 'Maha Suci Allah, Segala Puji Bagi Allah, Allah Maha Besar.',
        repeatCount: 33
      }
    ]
  },
  {
    id: '4',
    slug: 'doa',
    title: 'Doa Kebaikan Dunia Akhirat',
    description: 'Doa memohon kebaikan hidup di dunia, keselamatan di akhirat, dan perlindungan dari siksa api neraka.',
    category: 'Doa',
    estimatedTime: '2-3 Menit',
    sections: [
      {
        id: 'doa-1',
        title: 'Rabbana Atina',
        arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
        transliteration: 'Rabbana aatina fid-dunya hasanatah, wa fil-aakhirati hasanatah, wa qinaa \'adzaaban-naar.',
        translation: 'Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat dan lindungilah kami dari azab neraka.'
      }
    ]
  }
];
