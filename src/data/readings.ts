import { Reading } from '@/types/reading';
import { validateReadingsData } from '@/lib/reading-validation';

const rawReadingsData: Reading[] = [
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
        title: 'Ilaa Hadhroti Sayyidinaa Muhammad',
        arabic: 'الى حضرة سيدنا محمد صلى الله عليه وسلم الفاتحة',
        transliteration: "ILAA HADLROTI SAYYIDINAA MUHAMMADIN SHOLLALLOOHU 'ALAIHI WASSALAM, ALFAATIHAH !",
        translation: 'Di hadiyahkan ke haribaan Junjungan kami Kanjeng Nabi Besar Muhammad Shollallohu ‘alaihi Wasallam. Al-Fatihah!',
        instruction: 'Membaca Surat Fatihah 7x',
        repeatCount: 7
      },
      {
        id: 'sw-2',
        title: 'Wa Ilaa Hadhroti Ghoutsi Haadzaz-Zaman',
        arabic: 'ثم الى حضرة غوث هذا الزمان وأعوانه وسائر أوليآء الله رضى الله تعالى عنهم الفاتحة',
        transliteration: "WA ILAA HADLROTI GHOUTSI HAADAZ-ZAMAN WAA'AWAANIHI WASAAAIRI AULIYAAILLAAHI RODLIYALLOOHU TA'AALA ‘ANHUM ALFAATIHAH !",
        translation: 'Dan di hadiyahkan ke pangkuan Ghoutsi Hadhazzaman, Para Pembantu Beliau dan segenap Kekasih ALLAH, Rodiyallohu ta’alaa Anhum. Al-Fatihah !',
        instruction: 'Membaca Surat Fatihah 7x',
        repeatCount: 7
      },
      {
        id: 'sw-3',
        title: 'Allahumma Yaa Waahidu Yaa Ahad',
        arabic: 'اللهم يا واحد يا احد, يا واجد يا جواد, صل وسلم وبارك على سيدنا محمد وعلى آل سيدنا محمد, فى كل لمحة ونفس بعدد معلومات الله وفيوضاته وامداده',
        transliteration: "ALLOOHUMMA YAA WAAHIDU YAA AHAD, YAA WAAJIDU YAA JAWAAD, SHOLLI WASALLIM WABAARIK ‘ALAA SAYYIDINAA MUHAMMADIW-WA'ALAA AALI SAYYIDINAA MUHAMMAD. FII KULLI LAMHATIW WA NAFASIM BI'ADADI MA'LUMAATILLAAHI, WA FUYUUDHOTIHI WA AMDAADIH.",
        translation: 'Yaa Alloh, Yaa Tuhan Maha Esa, Yaa Tuhan Maha Satu, Yaa Tuhan Maha Menemukan, Yaa Tuhan Maha Pelimpah, limpahkanlah sholawat salam barokah atas junjungan kami Kanjeng Nabi Muhammad dan atas keluarga Kanjeng Nabi Muhammad pada setiap kedipnya mata dan naik turunnya napas sebanyak bilangan segala yang Alloh Maha Mengetahui dan sebanyak kelimpahan pemberian dan kelestarian pemeliharaan Alloh.',
        repeatCount: 100
      },
      {
        id: 'sw-4',
        title: 'Allahumma Kamaa Anta Ahluh',
        arabic: 'اللهم كما انت اهله, صل وسلم وبارك على سيدنا ومولانا وشفيعنا وحبيبنا وقرة اعيننا محمد صلى الله عليه وسلم كما هو اهله, نسألك اللهم بحقه ان تغرقنا فى لجة بحر الوحدة, حتى لا نرى ولا نسمع ولا نجد ولا نحس ولا نتحرك ولا نسكن الا بها, وترزقنا تمام مغـفرتك ياالله, وتمام نعمـتك ياالله, وتمام معـرفتك ياالله, وتمام محـبتك ياالله, وتمام رضوانك ياالله, وصل وسلم وبارك عليه وعلى آله وصحبه عدد ما احاط به علمك واحصاه كتابك, برحمتك يا ارحم الراحمين والحمد لله رب العالمين',
        transliteration: "ALLOOHUMMA KAMAA ANTA AHLUH; SHOLLI WASALLIM WABAARIK ‘ALAA SAYYIDINAA WAMAULAANAA, WASYAFII'INAA, WAHABIIBINAA, WAQURROTI A'YUNINAA MUHAMMADIN SHOLLALLOOHU 'ALAIHI WASALLAMA KAMAA HUWA AHLUH; NAS-ALUKALLOOHUMMA BIHAQQIHI AN TUGHRIQONAA FII LUJJATI BAHRIL WAHDAH; HATTAA LAA NAROO WALAA NASMA'A, WALAA NAJIDA WALAA NUHISSA, WALAA NATAHARROKA WALAA NASKUNA ILLAA BIHAA; WATARZUQONAA TAMAAMA MAGHFIROTIKA YAA ALLOH, WATAMAAMA NI'MATIKA YAA ALLOH, WATAMAAMA MA'RIFATIKA YAA ALLOH, WATAMAAMA MAHABBATIKA YAA ALLOH, WATAMAAMA RIDLWANIKA YAA ALLOH; WASHOLLI WASALLIM WABAARIK ‘ALAIHI WA'ALAA AALIHI WASHOHBIH. ‘ADADAMAA AHAATHOBIHII ‘ILMUKA WAAHSHOOHU KITAABUK; BIROHMATIKA YAA ARHAMAR-ROOHIMIIN, WALHAMDU LILLAAHI ROBBIL'AALAMIIN.",
        translation: 'Yaa Alloh, sebagaimana keahlian ada pada-MU, limpahkanlah sholawat salam barokah atas Junjungan kami, Pemimpin kami, Pemberi Syafa’at kami, Kecintaan kami, dan Buah jantung hati kami Kanjeng Nabi Muhammad Shollallohu ‘Alaihi WaSallam yang sepadan dengan keahlian Beliau, kami bermohon kepada-MU Yaa Alloh, dengan hak kemuliaan Beliau, tenggelamkanlah kami didalam pusat dasar samudra ke-Esaan-MU sedemikian rupa sehingga tiada kami melihat dan mendengar, tiada kami menemukan dan merasa, dan tiada kami bergerak maupun berdiam, melainkan senantiasa merasa didalam samudra Tauhid-MU dan kami bermohon kepada-MU Yaa Alloh, limpahilah kami ampunan-MU yang sempurna Yaa Alloh, ni’mat karunia-MU yang sempurna Yaa Alloh, sadar ma’rifat kepada-MU yang sempurna Yaa Alloh, cinta kepad-MU dan menjadi kecintaan-MU yang sempurna Yaa Alloh, ridho kepada-MU dan memperoleh ridho-MU pula yang sempurna Yaa Alloh. Dan sekali lagi Yaa Alloh, limpahkanlah sholawat salam dan barokah atas Beliau Kanjeng Nabi dan atas keluarga dan sahabat Beliau sebanyak bilangan segala yang diliputi oleh Ilmu-MU dan termuat di dalam Kitab-MU, dengan Rahmat-MU Yaa Tuhan Yang Maha Pengasih lagi Maha Penyayang dan segala puji bagi Alloh Tuhan seru sekalian alam.',
        repeatCount: 7
      },
      {
        id: 'sw-5',
        title: "Yaa Syafi'al-Kholqi...",
        arabic: 'يا شافع الخلق الصلاة والسلام : عليك نور الخلق هادى الأنام واصـله وروحه ادركــنى : فـقد ظلـمت ابدا وربـنى وليس لى ياسـيدى سـواكا : فان ترد كنت شخصا هـالكا',
        transliteration: "YAA SYAFI'AL-KHOLQISH-SHOLAATU WASSALAAM \" ‘ALAIKA NUUROL KHOLQI HAADIYAL ANAAM\nWA ASHLAHUU WA RUUHAHU ADRIKNII \" FAQODH DHOLAMTU ABADAW-WAROBBINII\nWA LAISA LII YAA SAYYIDII SIWAAKA \" FA-IN TARUDDA KUNTU SYAKHSON HAALIKAA .......",
        translation: 'Duhai Kanjeng Nabi pemberi Syafa’at makhluq Kepangkuan-MU sholawat dan salam kusanjungkan ¨ Duhai Nur cahaya makhluq , pembimbing manusia ¨ Duhai unsur dan jiwa makhluq,bimbing dan didiklah diriku ¨ Maka sungguh aku manusia yang dholim selalu ¨ tiada arti diriku tanpa engkau Duhai Yaa Sayyidii ¨ jika engkau hindari aku (akibat keterlaluan berlarut-larutku), pastilah ‘ku ‘kan hancur binasa.',
        repeatCount: 3
      },
      {
        id: 'sw-6',
        title: 'Yaa Sayyidii Yaa Rosuulallah',
        arabic: 'يا سـيدى يا رسـول الله',
        transliteration: 'YAA SAYYIDII YAA ROSUULALLOH !.',
        translation: 'Duhai Pemimpinku, Duhai Utusan Alloh',
        repeatCount: 7
      },
      {
        id: 'sw-7',
        title: 'Yaa Ayyuhal-Ghoutsu...',
        arabic: 'يا ايها الغـوث ســلام الله : عـليك ربـــنى بإذن الله وانـظر الي سـيدى بنـظرة : موصـلة للحضـرة العلـية',
        transliteration: "YAA AYYUHAL-GHOUTSU SALAAMULLOOH \" ‘ALAIKA ROBBINII BI-IDZNILLAAH\nWANDHUR ILAYYA SAYYIDII BINADHROH \" MUUSHILATIL-LIL-HADLROTIL'ALIYYAH..",
        translation: 'Duhai Ghoutsu Hadhaz Zaman, kepangkuan-MU salam Alloh kuhaturkan ¨ Bimbing dan didiklah diriku dengan izin Alloh ¨ dan arahkan pancaran sinar Nadroh-MU kepadaku Duhai Yaa Sayyidii ¨ radiasi batin yang mewusulkan aku sadar kehadirat Maha Luhur Tuhanku',
        repeatCount: 3
      },
      {
        id: 'sw-8',
        title: "Yaa Syaafi'al-Kholqi Habiiballaahi...",
        arabic: 'يا شافع الخلـق حــبيب الله : صـلاته عليك مع ســلامه ضلت وضلت حيلتى فى بلدتى : خذ بيدى ياســيدى والأمة',
        transliteration: "YAA SYAAFI'AL-KHOLQI HABIIBALLOOHI \" SHOLAATUHUU'ALAIKA MA'SALAAMIHII,\nDHOLLAT WA DHOLLAT HIILATII FII BALDATII \" KHUDZ BIYADII YAA SAYYIDII WAL UMMATII .......",
        translation: 'Duhai Kanjeng Nabi penberi Syafa’at makhluq, duhai Kanjeng Nabi Kekasih Alloh ¨ Kepangkuan-MU sholawat dan salam Alloh aku sanjungkan ¨ jalanku buntu, usahaku tak menentu buat kesejahteraan negriku ¨ cepat, cepat, cepat raihlah tanganku Yaa Sayyidii tolonglah diriku dan seluruh ummat ini.',
        repeatCount: 3
      },
      {
        id: 'sw-9',
        title: 'Yaa Sayyidii Yaa Rosuulallah',
        arabic: 'يا سـيدى يا رسـول الله',
        transliteration: 'YAA SAYYIDII YAA ROSUULALLOH !.',
        translation: 'Duhai Pemimpinku, Duhai Utusan Alloh',
        repeatCount: 7
      },
      {
        id: 'sw-10',
        title: 'Yaa Robbanallaahumma...',
        arabic: 'يا ربنا اللهم صل وسلم على محمد شفيع الأمم والآل واجعل الأنام مسرعين بالواحدية لرب العالمين يا ربنا اغفر يسر افتح واهدنا قرب وألف بيننا يا ربنا',
        transliteration: "YAA ROBBANALLOOHUMMA SHOLLI SALLIMI \" ‘ALAA MUHAMMADIN SYAFII'IL UMAMI,\nWAL-AALI WAJ-‘ALIL ANAAMA MUSRI'IIN \" BIL-WAAHIDIYYATI LIROBBIL-‘AALAMIIN\nYAA ROBBANAGH-FIR YASSAIR IFTAH WAHDINAA \" QORRIB WA-ALLIF BAINANAA YAA ROBBANAA.",
        translation: 'Yaa Tuhan kami Yaa Alloh, limpahkanlah Sholawat dan Salam ¨ atas Kanjeng Nabi Muhammad pemberi Syafa’at ummat ¨ dan atas keluarga Beliau, dan jadikanlah ummat manusia cepat-cepat lari, ¨ lari kembali mengabdikan diri dan sadar kepada Tuhan Semesta alam, ¨ Yaa Tuhan kami, ampunilah dosa-dosa kami, permudahkanlah segala urusan kami, bukalah hati dan jalan kami, dan tunjukilah kami ¨ , pereratlah persaudaraan dan persatuan diantara kami, Yaa Tuhan kami.',
        repeatCount: 3
      },
      {
        id: 'sw-11',
        title: 'Allahumma Baarik Fiimaa Kholaqta...',
        arabic: 'اللهم بارك فيما خلقت وهذه البلدة ياالله وفى المجاهدة ياالله',
        transliteration: 'ALLOOHUMMA BAARIK FIIMAA KHOLAQTA WAHAADZIHIL BALDAH YAA ALLOH, WA FII HAADZIHIL MUJAAHADAH YAA ALLOH !',
        translation: 'Yaa Alloh limpahkanlah berkah didalam segala makhluq yang engkau ciptakan, dan didalam negri ini Yaa Alloh, dan didalam mujahadah ini Yaa Alloh',
        repeatCount: 7
      },
      {
        id: 'sw-12',
        title: 'Istighroq',
        transliteration: 'I S T I G H R O O Q !',
        instruction: 'Diam tidak membaca apa-apa, segenap perhatian lahir bathin, fikiran dan perasaan dipusatkan hanya kepada ALLOH! Tidak ada acara selain ALLOH'
      },
      {
        id: 'sw-13',
        title: 'Al-Fatihah',
        transliteration: 'ALFAATIHAH !',
        instruction: 'Membaca Surat Al-Fatihah 1 kali',
        repeatCount: 1
      },
      {
        id: 'sw-14',
        title: 'Doa Setelah Istighroq',
        arabic: 'ثم الإستغراق ساعة بقدر الطاقة وقراءة الفاتحة مرة ثم الدعاء : بسم الله الرحمن الرحيم اللهم بحق اسمك الأعظم وبجاه سيدنا محمد صلى الله عليه وسلم وببركة غوث هذا الزمان واعوانه وسائر أوليآئك ياالله, ياالله, ياالله رضى الله تعالى عنهم',
        transliteration: "BISMILLAAHIR ROHMAANIR ROHIIM,\nALLOOHUMMA BIHAQQISMIKAL A'DHOM WABIJAAHI SAYYIDINAA MUHAMMADIN SHOLLALLOHU ‘ALAIHI WASALLAM WABIBARAKATI GHOUTSI HADZAZ-ZAMAAN WA A'WAANIHI WA SAAIRI AULIYAAIKA YAA ALLOH, YAA ALLOH, YAA ALLOH, RODLIYALLOOHU TA'AALA'ANHUM.",
        translation: 'Dengan Nama Alloh Yang Maha Pengasih lagi Maha Penyayang Yaa Alloh, dengan hak kebesaran Asma-MU, dan dengan kemuliaan serta keagungan Kanjeng Nabi Mahammad Sollallohu ‘Alaihi WaSallam, dan dengan Barokahnya Ghoutsu Hadhaz Zaman wa A’wanihi serta segenap Auliya’ Kekasih-MU Yaa Alloh, Yaa Alloh Rodiyallohu Ta’ala Anhum',
        repeatCount: 3
      },
      {
        id: 'sw-15',
        title: "Balligh Jamii'al-'Aalamiin...",
        arabic: 'بلغ جميع العالمين ندآءنا هذا واجعل فيه تأثيرا بليغا',
        transliteration: "BALLIGH JAMII'AL ‘ALAMIIN NIDAA-ANAA HAADZAA WAJ'AL FIIHI TAKTSIIROM-BALIIGHOO.",
        translation: 'Sampaikanlah seruan kami ini kepada jami’al Alamin dan letakkanlah kesan yang sangat mendalam',
        repeatCount: 3
      },
      {
        id: 'sw-16',
        title: "Fa-innaka 'Alaa Kulli Syai-in Qodiir...",
        arabic: 'فانك على كل شئ قدير وبالإجابة جدير',
        transliteration: "FAINNAKA ‘ALAA KULLI SYAI-INGQODIIR WABIL IJABATI JADIIR.",
        translation: 'Maka sesungguhnya engkau Maha Kuasa berbuat segala sesuatu dan Maha Ahli memberi ijabah',
        repeatCount: 3
      },
      {
        id: 'sw-17',
        title: 'Fafirruu Ilallaah',
        arabic: 'ففروا الى الله',
        transliteration: 'FAFIRRUU ILALLOOH .',
        translation: 'Larilah kembali kepada Alloh !',
        repeatCount: 7
      },
      {
        id: 'sw-18',
        title: 'Waqul Jaa-al Haqqu...',
        arabic: 'وقل جاء الحق وزهق الباطل ان الباطل كان زهوقا',
        transliteration: 'WAQUL JAA-ALHAQQUWAZAHAQOL BAATHIL INNAL BAATHILA KAANA ZAHUUQOO',
        translation: 'Dan katakanlah (wahai Muhammad) perkara yang hak telah datang dan musnahlah perkara yang batal, sesungguhnya perkara yang batal itu pasti musnah.',
        instruction: "Keterangan tambahan ;\nFAFIRRUU ILALLOH dan WAQUL JAA-ALHAQQU… dibaca bersama-sama imam dan ma'mum. Maknanya : Larilah kembali kepada Alloh ! Dan semoga akhlaq=akhlaq batal yang rusak dan merusakkan segera diganti oleh Alloh dengan akhlaq yang baik dan yang menguntungkan! Kedua ajakan tersebut ditujukan kepada segenap masyarakat manusia dan jin seluruh dunia, terutama ditujukan kepada pribadi si pembaca sendiri!",
        repeatCount: 3
      },
      {
        id: 'sw-19',
        title: 'Al-Fatihah Penutup',
        transliteration: 'A L F A A T I H A H',
        instruction: 'Membaca Surat Al-Fatihah 1 kali',
        repeatCount: 1
      },
      {
        id: 'sw-20',
        title: 'Selesai',
        transliteration: 'S e l e s a i'
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
  },
  {
    id: '5',
    slug: 'yasin',
    title: 'Surat Yasin',
    description: 'Surat ke-36 Al-Qur\'an (83 ayat) yang banyak dibaca dalam doa, tahlil, dan majelis dzikir.',
    category: 'Al-Qur\'an',
    estimatedTime: '15-20 Menit',
    sections: [
      {
        id: 'ys-basmalah',
        title: 'Basmalah',
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        transliteration: 'Bismillaahir-rohmaanir-rohiim',
        translation: 'Dengan menyebut nama Allah Yang Maha Pengasih lagi Maha Penyayang.'
      },
      {
        id: 'ys-1',
        title: 'Ayat 1',
        arabic: 'يٰسۤ ۚ',
        transliteration: 'Yā sīn.',
        translation: 'Yā Sīn.'
      },
      {
        id: 'ys-2',
        title: 'Ayat 2',
        arabic: 'وَالْقُرْاٰنِ الْحَكِيْمِۙ',
        transliteration: 'Wal-qur\'ānil-ḥakīm(i).',
        translation: 'Demi Al-Qur’an yang penuh hikmah,'
      },
      {
        id: 'ys-3',
        title: 'Ayat 3',
        arabic: 'اِنَّكَ لَمِنَ الْمُرْسَلِيْنَۙ',
        transliteration: 'Innaka laminal-mursalīn(a).',
        translation: 'sesungguhnya engkau (Nabi Muhammad) benar-benar salah seorang dari rasul-rasul'
      },
      {
        id: 'ys-4',
        title: 'Ayat 4',
        arabic: 'عَلٰى صِرَاطٍ مُّسْتَقِيْمٍۗ',
        transliteration: '‘Alā ṣirāṭim mustaqīm(in).',
        translation: '(yang berada) di atas jalan yang lurus,'
      },
      {
        id: 'ys-5',
        title: 'Ayat 5',
        arabic: 'تَنْزِيْلَ الْعَزِيْزِ الرَّحِيْمِۙ',
        transliteration: 'Tanzīlal-‘azīzir-raḥīm(i).',
        translation: '(sebagai wahyu) yang diturunkan oleh (Allah) Yang Maha Perkasa lagi Maha Penyayang,'
      },
      {
        id: 'ys-6',
        title: 'Ayat 6',
        arabic: 'لِتُنْذِرَ قَوْمًا مَّآ اُنْذِرَ اٰبَاۤؤُهُمْ فَهُمْ غٰفِلُوْنَ',
        transliteration: 'Litunżira qaumam mā unżira ābā\'uhum fahum gāfilūn(a).',
        translation: 'agar engkau (Nabi Muhammad) memberi peringatan kepada suatu kaum yang nenek moyang mereka belum pernah diberi peringatan, sehingga mereka lalai.'
      },
      {
        id: 'ys-7',
        title: 'Ayat 7',
        arabic: 'لَقَدْ حَقَّ الْقَوْلُ عَلٰٓى اَكْثَرِهِمْ فَهُمْ لَا يُؤْمِنُوْنَ',
        transliteration: 'Laqad ḥaqqal-qaulu ‘alā akṡarihim fahum lā yu\'minūn(a).',
        translation: 'Sungguh, benar-benar berlaku perkataan (ketetapan takdir) terhadap kebanyakan mereka, maka mereka tidak akan beriman.'
      },
      {
        id: 'ys-8',
        title: 'Ayat 8',
        arabic: 'اِنَّا جَعَلْنَا فِيْٓ اَعْنَاقِهِمْ اَغْلٰلًا فَهِيَ اِلَى الْاَذْقَانِ فَهُمْ مُّقْمَحُوْنَ',
        transliteration: 'Innā ja‘alnā fī a‘nāqihim aglālan fa hiya ilal-ażqāni fahum muqmaḥūn(a).',
        translation: 'Sesungguhnya Kami telah memasang belenggu di leher mereka, lalu (tangan mereka yang terbelenggu diangkat) ke dagu, karena itu mereka tertengadah.'
      },
      {
        id: 'ys-9',
        title: 'Ayat 9',
        arabic: 'وَجَعَلْنَا مِنْۢ بَيْنِ اَيْدِيْهِمْ سَدًّا وَّمِنْ خَلْفِهِمْ سَدًّا فَاَغْشَيْنٰهُمْ فَهُمْ لَا يُبْصِرُوْنَ',
        transliteration: 'Wa ja‘alnā mim baini aidīhim saddaw wa min khalfihim saddan fa agsyaināhum fahum lā yubṣirūn(a).',
        translation: 'Kami memasang penghalang di hadapan mereka dan di belakang mereka, sehingga Kami menutupi (pandangan) mereka. Mereka pun tidak dapat melihat.'
      },
      {
        id: 'ys-10',
        title: 'Ayat 10',
        arabic: 'وَسَوَاۤءٌ عَلَيْهِمْ ءَاَنْذَرْتَهُمْ اَمْ لَمْ تُنْذِرْهُمْ لَا يُؤْمِنُوْنَ',
        transliteration: 'Wa sawā\'un ‘alaihim a\'anżartahum am lam tunżirhum lā yu\'minūn(a).',
        translation: 'Sama saja bagi mereka, apakah engkau (Nabi Muhammad) memberi peringatan kepada mereka atau tidak. Mereka (tetap) tidak akan beriman.'
      },
      {
        id: 'ys-11',
        title: 'Ayat 11',
        arabic: 'اِنَّمَا تُنْذِرُ مَنِ اتَّبَعَ الذِّكْرَ وَخَشِيَ الرَّحْمٰنَ بِالْغَيْبِۚ فَبَشِّرْهُ بِمَغْفِرَةٍ وَّاَجْرٍ كَرِيْمٍ',
        transliteration: 'Innamā tunżiru manittaba‘aż-żikra  wa khasyiyar-raḥmāna bil-gaib(i), fa basysyirhu bimagfiratiw wa ajrin karīm(in).',
        translation: 'Sesungguhnya engkau (Nabi Muhammad) hanya (bisa) memberi peringatan kepada orang-orang yang mau mengikutinya dan yang takut kepada Tuhan Yang Maha Pengasih tanpa melihat-Nya. Berilah mereka kabar gembira dengan ampunan dan pahala yang mulia.'
      },
      {
        id: 'ys-12',
        title: 'Ayat 12',
        arabic: 'اِنَّا نَحْنُ نُحْيِ الْمَوْتٰى وَنَكْتُبُ مَا قَدَّمُوْا وَاٰثَارَهُمْۗ وَكُلَّ شَيْءٍ اَحْصَيْنٰهُ فِيْٓ اِمَامٍ مُّبِيْنٍ ࣖ',
        transliteration: 'Innā naḥnu nuḥyil-mautā wa naktubu mā qaddamū wa āṡārahum, wa kulla syai\'in aḥṣaināhu fī imāmim mubīn(in).',
        translation: 'Sesungguhnya Kamilah yang menghidupkan orang-orang yang mati dan Kami (pulalah) yang mencatat apa yang telah mereka kerjakan dan bekas-bekas yang mereka (tinggalkan). Segala sesuatu Kami kumpulkan dalam kitab induk yang nyata (Lauhulmahfuz).'
      },
      {
        id: 'ys-13',
        title: 'Ayat 13',
        arabic: 'وَاضْرِبْ لَهُمْ مَّثَلًا اَصْحٰبَ الْقَرْيَةِۘ اِذْ جَاۤءَهَا الْمُرْسَلُوْنَۚ',
        transliteration: 'Waḍrib lahum maṡalan aṣḥābal-qaryah(ti), iż jā\'ahal-mursalūn(a).',
        translation: 'Buatlah suatu perumpamaan bagi mereka (kaum kafir Makkah), yaitu penduduk suatu negeri, ketika para utusan datang kepada mereka,'
      },
      {
        id: 'ys-14',
        title: 'Ayat 14',
        arabic: 'اِذْ اَرْسَلْنَآ اِلَيْهِمُ اثْنَيْنِ فَكَذَّبُوْهُمَا فَعَزَّزْنَا بِثَالِثٍ فَقَالُوْٓا اِنَّآ اِلَيْكُمْ مُّرْسَلُوْنَ',
        transliteration: 'Iż arsalnā ilaihimuṡnaini fa każżabūhumā fa ‘azzaznā biṡāliṡin faqālū innā ilaikum mursalūn(a).',
        translation: '(yaitu) ketika Kami mengutus kepada mereka dua orang utusan, lalu mereka mendustakan keduanya. Kemudian Kami menguatkan dengan (utusan) yang ketiga. Maka, ketiga (utusan itu) berkata, “Sesungguhnya kami adalah orang-orang yang diutus kepadamu.”'
      },
      {
        id: 'ys-15',
        title: 'Ayat 15',
        arabic: 'قَالُوْا مَآ اَنْتُمْ اِلَّا بَشَرٌ مِّثْلُنَاۙ وَمَآ اَنْزَلَ الرَّحْمٰنُ مِنْ شَيْءٍۙ اِنْ اَنْتُمْ اِلَّا تَكْذِبُوْنَ',
        transliteration: 'Qālū mā antum illā basyarum miṡlunā, wa mā anzalar-raḥmānu min syai\'(in), in antum illā takżibūn(a).',
        translation: 'Mereka (penduduk negeri) menjawab, “Kamu tidak lain hanyalah manusia seperti kami. (Allah) Yang Maha Pengasih tidak (pernah) menurunkan sesuatu apa pun. Kamu hanyalah berdusta.”'
      },
      {
        id: 'ys-16',
        title: 'Ayat 16',
        arabic: 'قَالُوْا رَبُّنَا يَعْلَمُ اِنَّآ اِلَيْكُمْ لَمُرْسَلُوْنَ',
        transliteration: 'Qālū rabbunā ya‘lamu innā ilaikum lamursalūn(a).',
        translation: 'Mereka (para rasul) berkata, “Tuhan kami mengetahui bahwa sesungguhnya kami benar-benar para utusan(-Nya) kepadamu.'
      },
      {
        id: 'ys-17',
        title: 'Ayat 17',
        arabic: 'وَمَا عَلَيْنَآ اِلَّا الْبَلٰغُ الْمُبِيْنُ',
        transliteration: 'Wa mā ‘alainā illal-balāgul-mubīn(u).',
        translation: 'Adapun kewajiban kami hanyalah menyampaikan (perintah Allah) yang jelas.”'
      },
      {
        id: 'ys-18',
        title: 'Ayat 18',
        arabic: 'قَالُوْٓا اِنَّا تَطَيَّرْنَا بِكُمْۚ  لَىِٕنْ لَّمْ تَنْتَهُوْا لَنَرْجُمَنَّكُمْ وَلَيَمَسَّنَّكُمْ مِّنَّا عَذَابٌ اَلِيْمٌ',
        transliteration: 'Qālū innā taṭayyarnā bikum, la\'il lam tantahū lanarjumannakum wa layamassannakum minnā ‘ażābun alīm(un).',
        translation: 'Mereka (penduduk negeri) menjawab, “Sesungguhnya kami bernasib malang karenamu. Sungguh, jika kamu tidak berhenti (menyeru kami), niscaya kami merajam kamu dan kamu pasti akan merasakan siksaan yang pedih dari kami.”'
      },
      {
        id: 'ys-19',
        title: 'Ayat 19',
        arabic: 'قَالُوْا طَاۤىِٕرُكُمْ مَّعَكُمْۗ اَىِٕنْ ذُكِّرْتُمْۗ بَلْ اَنْتُمْ قَوْمٌ مُّسْرِفُوْنَ',
        transliteration: 'Qālū ṭā\'irukum ma‘akum, a\'in żukkirtum, bal antum qaumum musrifūn(a).',
        translation: 'Mereka (para rasul) berkata, “Kemalangan kamu itu (akibat perbuatan) kamu sendiri. Apakah karena kamu diberi peringatan, (lalu kamu menjadi malang)? Sebenarnya kamu adalah kaum yang melampaui batas.”'
      },
      {
        id: 'ys-20',
        title: 'Ayat 20',
        arabic: 'وَجَاۤءَ مِنْ اَقْصَا الْمَدِيْنَةِ رَجُلٌ يَّسْعٰى قَالَ يٰقَوْمِ اتَّبِعُوا الْمُرْسَلِيْنَۙ',
        transliteration: 'Wa jā\'a min aqṣal-madīnati rajuluy yas‘ā qāla yā qaumittabi‘ul-mursalīn(a).',
        translation: 'Datanglah dengan bergegas dari ujung kota, seorang laki-laki. Dia berkata, “Wahai kaumku, ikutilah para rasul itu!'
      },
      {
        id: 'ys-21',
        title: 'Ayat 21',
        arabic: 'اتَّبِعُوْا مَنْ لَّا يَسْـَٔلُكُمْ اَجْرًا وَّهُمْ مُّهْتَدُوْنَ  ۔',
        transliteration: 'Ittabi‘ū mal lā yas\'alukum ajraw wa hum muhtadūn(a).',
        translation: 'Ikutilah orang yang tidak meminta imbalan (dalam berdakwah) kepadamu. Mereka adalah orang-orang yang mendapat petunjuk.'
      },
      {
        id: 'ys-22',
        title: 'Ayat 22',
        arabic: 'وَمَا لِيَ لَآ اَعْبُدُ الَّذِيْ فَطَرَنِيْ وَاِلَيْهِ تُرْجَعُوْنَ',
        transliteration: 'Wa mā liya lā a‘budul-lażī faṭaranī wa ilaihi turja‘ūn(a).',
        translation: 'Apa (alasanku) untuk tidak menyembah (Allah) yang telah menciptakanku dan hanya kepada-Nyalah kamu akan dikembalikan?'
      },
      {
        id: 'ys-23',
        title: 'Ayat 23',
        arabic: 'ءَاَتَّخِذُ مِنْ دُوْنِهٖٓ اٰلِهَةً اِنْ يُّرِدْنِ الرَّحْمٰنُ بِضُرٍّ لَّا تُغْنِ عَنِّيْ شَفَاعَتُهُمْ شَيْـًٔا وَّلَا يُنْقِذُوْنِۚ',
        transliteration: 'A\'attakhiżu min dūnihī ālihatan iy yuridnir-raḥmānu biḍurril lā tugni ‘annī syafā‘atuhum syai\'aw wa lā yunqiżūn(i).',
        translation: 'Mengapa aku (harus) mengambil sembahan-sembahan selain-Nya? Jika (Allah) Yang Maha Pengasih menghendaki bencana terhadapku, pasti pertolongan mereka tidak berguna sama sekali bagi diriku dan mereka (juga) tidak dapat menyelamatkanku.'
      },
      {
        id: 'ys-24',
        title: 'Ayat 24',
        arabic: 'اِنِّيْٓ اِذًا لَّفِيْ ضَلٰلٍ مُّبِيْنٍ',
        transliteration: 'Innī iżal lafī ḍalālim mubīn(in).',
        translation: 'Sesungguhnya aku (jika berbuat) begitu, pasti berada dalam kesesatan yang nyata.'
      },
      {
        id: 'ys-25',
        title: 'Ayat 25',
        arabic: 'اِنِّيْٓ اٰمَنْتُ بِرَبِّكُمْ فَاسْمَعُوْنِۗ',
        transliteration: 'Innī  āmantu birabbikum fasma‘ūn(i).',
        translation: 'Sesungguhnya aku telah beriman kepada Tuhanmu. Maka, dengarkanlah (pengakuan)-ku.”'
      },
      {
        id: 'ys-26',
        title: 'Ayat 26',
        arabic: 'قِيْلَ ادْخُلِ الْجَنَّةَ ۗقَالَ يٰلَيْتَ قَوْمِيْ يَعْلَمُوْنَۙ',
        transliteration: 'Qīladkhulil-jannah(ta), qāla yā laita qaumī ya‘lamūn(a).',
        translation: 'Dikatakan (kepadanya), “Masuklah ke surga.” Dia (laki-laki itu) berkata, “Aduhai, sekiranya kaumku mengetahui'
      },
      {
        id: 'ys-27',
        title: 'Ayat 27',
        arabic: 'بِمَا غَفَرَ لِيْ رَبِّيْ وَجَعَلَنِيْ مِنَ الْمُكْرَمِيْنَ',
        transliteration: 'Bimā gafaralī rabbī wa ja‘alanī minal-mukramīn(a).',
        translation: '(bagaimana) Tuhanku mengampuniku dan menjadikanku termasuk orang-orang yang dimuliakan.”'
      },
      {
        id: 'ys-28',
        title: 'Ayat 28',
        arabic: '۞ وَمَآ اَنْزَلْنَا عَلٰى قَوْمِهٖ مِنْۢ بَعْدِهٖ مِنْ جُنْدٍ مِّنَ السَّمَاۤءِ وَمَا كُنَّا مُنْزِلِيْنَ',
        transliteration: 'Wa mā anzalnā ‘alā qaumihī mim ba‘dihī min jundim minas-samā\'i wa mā kunnā munzilīn(a).',
        translation: 'Setelah dia (dibunuh), Kami tidak menurunkan satu pasukan pun dari langit kepada kaumnya dan Kami tidak perlu menurunkannya.'
      },
      {
        id: 'ys-29',
        title: 'Ayat 29',
        arabic: 'اِنْ كَانَتْ اِلَّا صَيْحَةً وَّاحِدَةً فَاِذَا هُمْ خٰمِدُوْنَ',
        transliteration: 'In kānat illā ṣaiḥataw wāḥidatan fa\'iżā hum khāmidūn(a).',
        translation: '(Azab mereka) itu cukup dengan satu teriakan saja. Maka, seketika itu mereka mati.'
      },
      {
        id: 'ys-30',
        title: 'Ayat 30',
        arabic: 'يٰحَسْرَةً عَلَى الْعِبَادِۚ مَا يَأْتِيْهِمْ مِّنْ رَّسُوْلٍ اِلَّا كَانُوْا بِهٖ يَسْتَهْزِءُوْنَ',
        transliteration: 'Yā ḥasratan ‘alal-‘ibād(i), mā ya\'tīhim mir rasūlin illā kānū bihī yastahzi\'ūn(a).',
        translation: 'Alangkah besar penyesalan diri para hamba itu. Setiap datang seorang rasul kepada mereka, mereka selalu memperolok-olokkannya.'
      },
      {
        id: 'ys-31',
        title: 'Ayat 31',
        arabic: 'اَلَمْ يَرَوْا كَمْ اَهْلَكْنَا قَبْلَهُمْ مِّنَ الْقُرُوْنِ اَنَّهُمْ اِلَيْهِمْ لَا يَرْجِعُوْنَ',
        transliteration: 'Alam yarau kam ahlaknā qablahum minal-qurūni annahum ilaihim lā yarji‘ūn(a).',
        translation: 'Tidakkah mereka mengetahui berapa banyak umat sebelum mereka yang telah Kami binasakan? Mereka (setelah binasa) tidak ada yang kembali kepada mereka (di dunia).'
      },
      {
        id: 'ys-32',
        title: 'Ayat 32',
        arabic: 'وَاِنْ كُلٌّ لَّمَّا جَمِيْعٌ لَّدَيْنَا مُحْضَرُوْنَ ࣖ',
        transliteration: 'Wa in kullul lammā jamī‘ul ladainā muḥḍarūn(a).',
        translation: 'Tidak ada satu (umat) pun, kecuali semuanya akan dihadirkan kepada Kami (untuk dihisab).'
      },
      {
        id: 'ys-33',
        title: 'Ayat 33',
        arabic: 'وَاٰيَةٌ لَّهُمُ الْاَرْضُ الْمَيْتَةُ ۖاَحْيَيْنٰهَا وَاَخْرَجْنَا مِنْهَا حَبًّا فَمِنْهُ يَأْكُلُوْنَ',
        transliteration: 'Wa āyatul lahumul-arḍul-maitah(tu), aḥyaināhā wa akhrajnā minhā ḥabban faminhu ya\'kulūn(a).',
        translation: 'Suatu tanda (kekuasaan-Nya) bagi mereka adalah bumi yang mati (tandus lalu) Kami menghidupkannya dan mengeluarkan darinya biji-bijian kemudian dari (biji-bijian) itu mereka makan.'
      },
      {
        id: 'ys-34',
        title: 'Ayat 34',
        arabic: 'وَجَعَلْنَا فِيْهَا جَنّٰتٍ مِّنْ نَّخِيْلٍ وَّاَعْنَابٍ وَّفَجَّرْنَا فِيْهَا مِنَ الْعُيُوْنِۙ',
        transliteration: 'Wa ja‘alnā fīhā jannātim min nakhīliw wa a‘nābiw wa fajjarnā fīhā minal-‘uyūn(i).',
        translation: 'Kami (juga) menjadikan padanya (bumi) kebun-kebun kurma dan anggur serta Kami memancarkan padanya beberapa mata air'
      },
      {
        id: 'ys-35',
        title: 'Ayat 35',
        arabic: 'لِيَأْكُلُوْا مِنْ ثَمَرِهٖۙ وَمَا عَمِلَتْهُ اَيْدِيْهِمْ ۗ اَفَلَا يَشْكُرُوْنَ',
        transliteration: 'Liya\'kulū min ṡamarihī wa mā ‘amilathu aidīhim, afalā yasykurūn(a).',
        translation: 'agar mereka dapat makan dari buahnya, dan dari hasil usaha tangan mereka. Mengapa mereka tidak bersyukur?'
      },
      {
        id: 'ys-36',
        title: 'Ayat 36',
        arabic: 'سُبْحٰنَ الَّذِيْ خَلَقَ الْاَزْوَاجَ كُلَّهَا مِمَّا تُنْۢبِتُ الْاَرْضُ وَمِنْ اَنْفُسِهِمْ وَمِمَّا لَا يَعْلَمُوْنَ',
        transliteration: 'Subḥānal-lażī khalaqal-azwāja kullahā mimmā tumbitul-arḍu wa min anfusihim wa mimmā lā ya‘lamūn(a).',
        translation: 'Maha Suci (Allah) yang telah menciptakan semuanya berpasang-pasangan, baik dari apa yang ditumbuhkan oleh bumi dan dari diri mereka sendiri maupun dari apa yang tidak mereka ketahui.'
      },
      {
        id: 'ys-37',
        title: 'Ayat 37',
        arabic: 'وَاٰيَةٌ لَّهُمُ الَّيْلُ ۖنَسْلَخُ مِنْهُ النَّهَارَ فَاِذَا هُمْ مُّظْلِمُوْنَۙ',
        transliteration: 'Wa āyatul lahumul-lailu naslakhu minhun-nahāra fa\'iżā hum muẓlimūn(a).',
        translation: 'Suatu tanda juga (atas kekuasaan Allah) bagi mereka adalah malam. Kami pisahkan siang dari (malam) itu. Maka, seketika itu mereka (berada dalam) kegelapan.'
      },
      {
        id: 'ys-38',
        title: 'Ayat 38',
        arabic: 'وَالشَّمْسُ تَجْرِيْ لِمُسْتَقَرٍّ لَّهَا ۗذٰلِكَ تَقْدِيْرُ الْعَزِيْزِ الْعَلِيْمِۗ',
        transliteration: 'Wasy-syamsu tajrī limustaqarril lahā, żālika taqdīrul-‘azīzil-‘alīm(i).',
        translation: '(Suatu tanda juga atas kekuasaan Allah bagi mereka adalah) matahari yang berjalan di tempat peredarannya. Demikianlah ketetapan (Allah) Yang Maha Perkasa lagi Maha Mengetahui.'
      },
      {
        id: 'ys-39',
        title: 'Ayat 39',
        arabic: 'وَالْقَمَرَ قَدَّرْنٰهُ مَنَازِلَ حَتّٰى عَادَ كَالْعُرْجُوْنِ الْقَدِيْمِ',
        transliteration: 'Wal-qamara qaddarnāhu manāzila ḥattā ‘āda kal-‘urjūnil-qadīm(i).',
        translation: '(Begitu juga) bulan, Kami tetapkan bagi(-nya) tempat-tempat peredaran sehingga (setelah ia sampai ke tempat peredaran yang terakhir,) kembalilah ia seperti bentuk tandan yang tua.'
      },
      {
        id: 'ys-40',
        title: 'Ayat 40',
        arabic: 'لَا الشَّمْسُ يَنْۢبَغِيْ لَهَآ اَنْ تُدْرِكَ الْقَمَرَ وَلَا الَّيْلُ سَابِقُ النَّهَارِ ۗوَكُلٌّ فِيْ فَلَكٍ يَّسْبَحُوْنَ',
        transliteration: 'Lasy-syamsu yambagī lahā an tudrikal-qamara wa lal-lailu sābiqun-nahār(i), wa kullun fī falakiy yasbaḥūn(a).',
        translation: 'Tidaklah mungkin bagi matahari mengejar bulan dan malam pun tidak dapat mendahului siang. Masing-masing beredar pada garis edarnya.'
      },
      {
        id: 'ys-41',
        title: 'Ayat 41',
        arabic: 'وَاٰيَةٌ لَّهُمْ اَنَّا حَمَلْنَا ذُرِّيَّتَهُمْ فِى الْفُلْكِ الْمَشْحُوْنِۙ',
        transliteration: 'Wa āyatul lahum annā ḥamalnā żurriyyatahum fil-fulkil-masyḥūn(i).',
        translation: 'Suatu tanda (kebesaran Allah) bagi mereka adalah bahwa Kami mengangkut keturunan mereka dalam kapal yang penuh muatan.'
      },
      {
        id: 'ys-42',
        title: 'Ayat 42',
        arabic: 'وَخَلَقْنَا لَهُمْ مِّنْ مِّثْلِهٖ مَا يَرْكَبُوْنَ',
        transliteration: 'Wa khalaqnā lahum mim miṡlihī mā yarkabūn(a).',
        translation: '(Begitu juga) Kami menciptakan untuk mereka dari jenis itu angkutan (lain) yang mereka kendarai.'
      },
      {
        id: 'ys-43',
        title: 'Ayat 43',
        arabic: 'وَاِنْ نَّشَأْ نُغْرِقْهُمْ فَلَا صَرِيْخَ لَهُمْ وَلَاهُمْ يُنْقَذُوْنَۙ',
        transliteration: 'Wa in nasya\' nugriqhum falā ṣarīkha lahum wa lā hum yunqażūn(a).',
        translation: 'Jika Kami menghendaki, Kami akan menenggelamkan mereka. Kemudian, tidak ada penolong bagi mereka dan tidak (pula) mereka diselamatkan.'
      },
      {
        id: 'ys-44',
        title: 'Ayat 44',
        arabic: 'اِلَّا رَحْمَةً مِّنَّا وَمَتَاعًا اِلٰى حِيْنٍ',
        transliteration: 'Illā raḥmatam minnā wa matā‘an ilā ḥīn(in).',
        translation: 'Akan tetapi, (Kami menyelamatkan mereka) karena rahmat yang besar dari Kami dan untuk memberi mereka kesenangan hidup sampai waktu tertentu.'
      },
      {
        id: 'ys-45',
        title: 'Ayat 45',
        arabic: 'وَاِذَا قِيْلَ لَهُمُ اتَّقُوْا مَا بَيْنَ اَيْدِيْكُمْ وَمَا خَلْفَكُمْ لَعَلَّكُمْ تُرْحَمُوْنَ',
        transliteration: 'Wa iżā qīla lahumuttaqū mā baina aidīkum wa mā khalfakum la‘allakum turḥamūn(a).',
        translation: 'Ketika dikatakan kepada mereka, “Takutlah kamu akan (siksa) yang ada di hadapanmu (di dunia) dan azab yang ada di belakangmu (akhirat) agar kamu mendapat rahmat,” (maka mereka berpaling).'
      },
      {
        id: 'ys-46',
        title: 'Ayat 46',
        arabic: 'وَمَا تَأْتِيْهِمْ مِّنْ اٰيَةٍ مِّنْ اٰيٰتِ رَبِّهِمْ اِلَّا كَانُوْا عَنْهَا مُعْرِضِيْنَ',
        transliteration: 'Wa mā ta\'tīhim min āyatim min āyāti rabbihim illā kānū ‘anhā mu‘riḍīn(a).',
        translation: 'Tidak satu pun dari tanda-tanda (kebesaran) Tuhan datang kepada mereka, kecuali mereka berpaling darinya.'
      },
      {
        id: 'ys-47',
        title: 'Ayat 47',
        arabic: 'وَاِذَا قِيْلَ لَهُمْ اَنْفِقُوْا مِمَّا رَزَقَكُمُ اللّٰهُ ۙقَالَ الَّذِيْنَ كَفَرُوْا لِلَّذِيْنَ اٰمَنُوْٓا اَنُطْعِمُ مَنْ لَّوْ يَشَاۤءُ اللّٰهُ اَطْعَمَهٗٓ  ۖاِنْ اَنْتُمْ اِلَّا فِيْ ضَلٰلٍ مُّبِيْنٍ',
        transliteration: 'Wa iżā qīla lahum anfiqū mimmā razaqakumullāh(u), qālal-lażīna kafarū lil-lażīna āmanū anuṭ‘imu mal lau yasyā\'ullāhu aṭ‘amah(ū), in antum illā fī ḍalālim mubīn(in).',
        translation: 'Apabila dikatakan kepada mereka, “Infakkanlah sebagian rezeki yang diberikan Allah kepadamu,” orang-orang yang kufur itu berkata kepada orang-orang yang beriman, “Apakah pantas kami memberi makan kepada orang-orang yang jika Allah menghendaki, Dia akan memberinya makan? Kamu benar-benar dalam kesesatan yang nyata.”'
      },
      {
        id: 'ys-48',
        title: 'Ayat 48',
        arabic: 'وَيَقُوْلُوْنَ مَتٰى هٰذَا الْوَعْدُ اِنْ كُنْتُمْ صٰدِقِيْنَ',
        transliteration: 'Wa yaqūlūna matā hāżal-wa‘du in kuntum ṣādiqīn(a).',
        translation: 'Mereka berkata, “Kapankah janji (hari Kebangkitan) ini (terjadi) jika kamu orang-orang benar?”'
      },
      {
        id: 'ys-49',
        title: 'Ayat 49',
        arabic: 'مَا يَنْظُرُوْنَ اِلَّا صَيْحَةً وَّاحِدَةً تَأْخُذُهُمْ وَهُمْ يَخِصِّمُوْنَ',
        transliteration: 'Mā yanẓurūna illā ṣaiḥataw wāḥidatan ta\'khużuhum wa hum yakhiṣṣimūn(a).',
        translation: 'Mereka hanya menunggu satu teriakan yang akan membinasakan mereka saat mereka (sibuk) bertengkar (tentang urusan dunia).'
      },
      {
        id: 'ys-50',
        title: 'Ayat 50',
        arabic: 'فَلَا يَسْتَطِيْعُوْنَ تَوْصِيَةً وَّلَآ اِلٰٓى اَهْلِهِمْ يَرْجِعُوْنَ ࣖ',
        transliteration: 'Falā yastaṭī‘ūna tauṣiyataw wa lā ilā ahlihim yarji‘ūn(a).',
        translation: 'Oleh sebab itu, mereka tidak dapat berwasiat dan tidak dapat kembali kepada keluarganya.'
      },
      {
        id: 'ys-51',
        title: 'Ayat 51',
        arabic: 'وَنُفِخَ فِى الصُّوْرِ فَاِذَا هُمْ مِّنَ الْاَجْدَاثِ اِلٰى رَبِّهِمْ يَنْسِلُوْنَ',
        transliteration: 'Wa nufikha fiṣ-ṣūri fa\'iżā hum minal-ajdāṡi ilā rabbihim yansilūn(a).',
        translation: 'Sangkakala pun ditiup dan seketika itu mereka bergerak cepat dari kuburnya menuju kepada Tuhannya.'
      },
      {
        id: 'ys-52',
        title: 'Ayat 52',
        arabic: 'قَالُوْا يٰوَيْلَنَا مَنْۢ بَعَثَنَا مِنْ مَّرْقَدِنَا ۜهٰذَا مَا وَعَدَ الرَّحْمٰنُ وَصَدَقَ الْمُرْسَلُوْنَ',
        transliteration: 'Qālū yā wailanā mam ba‘aṡanā mim marqadinā…hāżā mā wa‘adar-raḥmānu wa ṣadaqal-mursalūn(a).',
        translation: 'Mereka berkata, “Celakalah kami! Siapakah yang membangkitkan kami dari tempat tidur kami (kubur)?” (Lalu, dikatakan kepada mereka,) “Inilah yang dijanjikan (Allah) Yang Maha Pengasih dan benarlah para rasul(-Nya).”'
      },
      {
        id: 'ys-53',
        title: 'Ayat 53',
        arabic: 'اِنْ كَانَتْ اِلَّا صَيْحَةً وَّاحِدَةً فَاِذَا هُمْ جَمِيْعٌ لَّدَيْنَا مُحْضَرُوْنَ',
        transliteration: 'In kānat illā ṣaiḥataw wāḥidatan fa\'iżā hum jamī‘ul ladainā muḥḍarūn(a).',
        translation: 'Teriakan itu hanya sekali saja, maka seketika itu mereka semua dihadapkan kepada Kami (untuk dihisab).'
      },
      {
        id: 'ys-54',
        title: 'Ayat 54',
        arabic: 'فَالْيَوْمَ لَا تُظْلَمُ نَفْسٌ شَيْـًٔا وَّلَا تُجْزَوْنَ اِلَّا مَا كُنْتُمْ تَعْمَلُوْنَ',
        transliteration: 'Fal-yauma lā tuẓlamu nafsun syai\'aw wa lā tujzauna illā mā kuntum ta‘malūn(a).',
        translation: 'Pada hari itu tidak ada sama sekali orang yang dirugikan sedikit pun. Kamu tidak akan diberi balasan, kecuali atas apa yang telah kamu kerjakan.'
      },
      {
        id: 'ys-55',
        title: 'Ayat 55',
        arabic: 'اِنَّ اَصْحٰبَ الْجَنَّةِ الْيَوْمَ فِيْ شُغُلٍ فٰكِهُوْنَ ۚ',
        transliteration: 'Inna aṣḥābal-jannatil-yauma fī syugulin fākihūn(a).',
        translation: 'Sesungguhnya penghuni surga pada hari itu berada dalam kesibukan (sehingga tidak sempat berpikir tentang penghuni neraka) lagi bersenang-senang.'
      },
      {
        id: 'ys-56',
        title: 'Ayat 56',
        arabic: 'هُمْ وَاَزْوَاجُهُمْ فِيْ ظِلٰلٍ عَلَى الْاَرَاۤىِٕكِ مُتَّكِـُٔوْنَ ۚ',
        transliteration: 'Hum wa azwājuhum fī ẓilālin ‘alal-arā\'iki muttaki\'ūn(a).',
        translation: 'Mereka dan pasangan-pasangannya berada dalam tempat yang teduh sambil berbaring di atas ranjang berkelambu.'
      },
      {
        id: 'ys-57',
        title: 'Ayat 57',
        arabic: 'لَهُمْ فِيْهَا فَاكِهَةٌ وَّلَهُمْ مَّا يَدَّعُوْنَ ۚ',
        transliteration: 'Lahum fīhā fākihatuw wa lahum mā yadda‘ūn(a).',
        translation: 'Di (surga) itu mereka memperoleh buah-buahan dan apa saja yang mereka inginkan.'
      },
      {
        id: 'ys-58',
        title: 'Ayat 58',
        arabic: 'سَلٰمٌۗ قَوْلًا مِّنْ رَّبٍّ رَّحِيْمٍ',
        transliteration: 'Salāmun qaulam mir rabbir raḥīm(in).',
        translation: '(Kepada mereka dikatakan,) “Salam sejahtera” sebagai ucapan dari Tuhan Yang Maha Penyayang.'
      },
      {
        id: 'ys-59',
        title: 'Ayat 59',
        arabic: 'وَامْتَازُوا الْيَوْمَ اَيُّهَا الْمُجْرِمُوْنَ',
        transliteration: 'Wamtāzul-yauma  ayyuhal-mujrimūn(a).',
        translation: '(Dikatakan kepada orang-orang kafir,) “Berpisahlah kamu (dari orang-orang mukmin) pada hari ini, wahai para pendurhaka!'
      },
      {
        id: 'ys-60',
        title: 'Ayat 60',
        arabic: '۞ اَلَمْ اَعْهَدْ اِلَيْكُمْ يٰبَنِيْٓ اٰدَمَ اَنْ لَّا تَعْبُدُوا الشَّيْطٰنَۚ اِنَّهٗ لَكُمْ عَدُوٌّ مُّبِيْنٌ',
        transliteration: 'Alam a‘had ilaikum yā banī ādama allā ta‘budusy-syaiṭān(a), innahū lakum ‘aduwwum mubīn(un).',
        translation: 'Bukankah Aku telah berpesan kepadamu dengan sungguh-sungguh, wahai anak cucu Adam, bahwa janganlah kamu menyembah setan? Sesungguhnya setan itu musuh yang nyata bagi kamu.'
      },
      {
        id: 'ys-61',
        title: 'Ayat 61',
        arabic: 'وَاَنِ اعْبُدُوْنِيْ ۗهٰذَا صِرَاطٌ مُّسْتَقِيْمٌ',
        transliteration: 'Wa ani‘budūnī, hāżā ṣirāṭum mustaqīm(un).',
        translation: '(Begitu juga bahwa) sembahlah Aku. Inilah jalan yang lurus.”'
      },
      {
        id: 'ys-62',
        title: 'Ayat 62',
        arabic: 'وَلَقَدْ اَضَلَّ مِنْكُمْ جِبِلًّا كَثِيْرًا ۗاَفَلَمْ تَكُوْنُوْا تَعْقِلُوْنَ',
        transliteration: 'Wa laqad aḍalla minkum jibillan kaṡīrā(n), afalam takūnū ta‘qilūn(a).',
        translation: 'Sungguh, ia (setan itu) benar-benar telah menyesatkan sangat banyak orang dari kamu. Maka, apakah kamu tidak mengerti?'
      },
      {
        id: 'ys-63',
        title: 'Ayat 63',
        arabic: 'هٰذِهٖ جَهَنَّمُ الَّتِيْ كُنْتُمْ تُوْعَدُوْنَ',
        transliteration: 'Hāżihī jahannamul-latī kuntum tū‘adūn(a).',
        translation: 'Inilah (neraka) Jahanam yang dahulu telah diperingatkan kepadamu.'
      },
      {
        id: 'ys-64',
        title: 'Ayat 64',
        arabic: 'اِصْلَوْهَا الْيَوْمَ بِمَا كُنْتُمْ تَكْفُرُوْنَ',
        transliteration: 'Iṣlauhal-yauma bimā kuntum takfurūn(a).',
        translation: 'Masuklah ke dalamnya pada hari ini karena dahulu kamu mengingkarinya.'
      },
      {
        id: 'ys-65',
        title: 'Ayat 65',
        arabic: 'اَلْيَوْمَ نَخْتِمُ عَلٰٓى اَفْوَاهِهِمْ وَتُكَلِّمُنَآ اَيْدِيْهِمْ وَتَشْهَدُ اَرْجُلُهُمْ بِمَا كَانُوْا يَكْسِبُوْنَ',
        transliteration: 'Al-yauma nakhtimu ‘alā afwāhihim wa tukallimunā aidīhim wa tasyhadu arjuluhum bimā kānū yaksibūn(a).',
        translation: 'Pada hari ini Kami membungkam mulut mereka. Tangan merekalah yang berkata kepada Kami dan kaki merekalah yang akan bersaksi terhadap apa yang dahulu mereka kerjakan.'
      },
      {
        id: 'ys-66',
        title: 'Ayat 66',
        arabic: 'وَلَوْ نَشَاۤءُ لَطَمَسْنَا عَلٰٓى اَعْيُنِهِمْ فَاسْتَبَقُوا الصِّرَاطَ فَاَنّٰى يُبْصِرُوْنَ',
        transliteration: 'Wa lau nasyā\'u laṭamasnā ‘alā a‘yunihim fastabaquṣ-ṣirāṭa fa annā yubṣirūn(a). ',
        translation: 'Seandainya Kami menghendaki, pastilah Kami akan menghapus penglihatan (membutakan) mereka sehingga mereka berlomba-lomba (mencari) jalan (selamat). Maka, bagaimana mungkin mereka dapat melihat?'
      },
      {
        id: 'ys-67',
        title: 'Ayat 67',
        arabic: 'وَلَوْ نَشَاۤءُ لَمَسَخْنٰهُمْ عَلٰى مَكَانَتِهِمْ فَمَا اسْتَطَاعُوْا مُضِيًّا وَّلَا يَرْجِعُوْنَ ࣖ',
        transliteration: 'Wa lau nasyā\'u lamasakhnāhum ‘alā makānatihim famastaṭā‘ū muḍiyyaw wa lā yarji‘ūn(a).',
        translation: 'Seandainya Kami menghendaki, pastilah Kami akan mengubah bentuk mereka di tempat mereka berada, sehingga mereka tidak sanggup meneruskan perjalanan dan juga tidak sanggup pulang kembali.'
      },
      {
        id: 'ys-68',
        title: 'Ayat 68',
        arabic: 'وَمَنْ نُّعَمِّرْهُ نُنَكِّسْهُ فِى الْخَلْقِۗ اَفَلَا يَعْقِلُوْنَ',
        transliteration: 'Wa man nu‘ammirhu nunakkishu fil-khalq(i), afalā ya‘qilūn(a).',
        translation: 'Siapa yang Kami panjangkan umurnya niscaya Kami balik proses penciptaannya (dari kuat menuju lemah). Maka, apakah mereka tidak mengerti?'
      },
      {
        id: 'ys-69',
        title: 'Ayat 69',
        arabic: 'وَمَا عَلَّمْنٰهُ الشِّعْرَ وَمَا يَنْۢبَغِيْ لَهٗ ۗاِنْ هُوَ اِلَّا ذِكْرٌ وَّقُرْاٰنٌ مُّبِيْنٌ ۙ',
        transliteration: 'Wa mā ‘allamnāhusy-syi‘ra wa mā yambagī lah(ū), in huwa illā żikruw wa qur\'ānum mubīn(un).',
        translation: 'Kami tidak mengajarkan syair kepadanya (Nabi Muhammad) dan (bersyair) itu tidaklah pantas baginya. (Wahyu yang Kami turunkan kepadanya) itu tidak lain hanyalah pelajaran dan Al-Qur’an yang jelas'
      },
      {
        id: 'ys-70',
        title: 'Ayat 70',
        arabic: 'لِّيُنْذِرَ مَنْ كَانَ حَيًّا وَّيَحِقَّ الْقَوْلُ عَلَى الْكٰفِرِيْنَ',
        transliteration: 'Liyunżira man kāna ḥayyaw wa yaḥiqqal-qaulu ‘alal-kāfirīn(a).',
        translation: 'agar dia (Nabi Muhammad) memberi peringatan kepada orang-orang yang hidup (hatinya) dan agar ketetapan (azab) terhadap orang-orang kafir itu menjadi pasti.'
      },
      {
        id: 'ys-71',
        title: 'Ayat 71',
        arabic: 'اَوَلَمْ يَرَوْا اَنَّا خَلَقْنَا لَهُمْ مِّمَّا عَمِلَتْ اَيْدِيْنَآ اَنْعَامًا فَهُمْ لَهَا مٰلِكُوْنَ',
        transliteration: 'Awalam yarau annā khalaqnā lahum mimmā ‘amilat aidīnā an‘āman fahum lahā mālikūn(a).',
        translation: 'Tidakkah mereka mengetahui bahwa Kami telah menciptakan untuk mereka hewan-hewan ternak dari ciptaan tangan Kami (sendiri), lalu mereka menjadi pemiliknya?'
      },
      {
        id: 'ys-72',
        title: 'Ayat 72',
        arabic: 'وَذَلَّلْنٰهَا لَهُمْ فَمِنْهَا رَكُوْبُهُمْ وَمِنْهَا يَأْكُلُوْنَ',
        transliteration: 'Wa żallalnāhā lahum fa minhā rakūbuhum wa minhā ya\'kulūn(a).',
        translation: 'Kami menjadikannya (hewan-hewan itu) tunduk kepada mereka. Sebagian di antaranya menjadi tunggangan mereka dan sebagian (lagi) mereka makan.'
      },
      {
        id: 'ys-73',
        title: 'Ayat 73',
        arabic: 'وَلَهُمْ فِيْهَا مَنَافِعُ وَمَشَارِبُۗ اَفَلَا يَشْكُرُوْنَ',
        transliteration: 'Wa lahum fīhā manāfi‘u wa masyārib(u), afalā yasykurūn(a).',
        translation: 'Pada dirinya (hewan-hewan ternak itu) terdapat berbagai manfaat dan minuman untuk mereka. Apakah mereka tidak bersyukur?'
      },
      {
        id: 'ys-74',
        title: 'Ayat 74',
        arabic: 'وَاتَّخَذُوْا مِنْ دُوْنِ اللّٰهِ اٰلِهَةً لَّعَلَّهُمْ يُنْصَرُوْنَ ۗ',
        transliteration: 'Wattakhażū min dūnillāhi ālihatal la‘allahum yunṣarūn(a).',
        translation: 'Mereka menjadikan sesembahan selain Allah agar mereka mendapat pertolongan.'
      },
      {
        id: 'ys-75',
        title: 'Ayat 75',
        arabic: 'لَا يَسْتَطِيْعُوْنَ نَصْرَهُمْۙ وَهُمْ لَهُمْ جُنْدٌ مُّحْضَرُوْنَ',
        transliteration: 'Lā yastaṭī‘ūna naṣrahum, wa hum lahum jundum muḥḍarūn(a).',
        translation: '(Sesembahan) itu tidak mampu menolong mereka, padahal (sesembahan) itu adalah tentara yang dihadirkan untuk menjaganya.'
      },
      {
        id: 'ys-76',
        title: 'Ayat 76',
        arabic: 'فَلَا يَحْزُنْكَ قَوْلُهُمْ ۘاِنَّا نَعْلَمُ مَا يُسِرُّوْنَ وَمَا يُعْلِنُوْنَ',
        transliteration: 'Falā yaḥzunka qauluhum, innā na‘lamu mā yusirrūna wa mā yu‘linūn(a).',
        translation: 'Maka, jangan sampai ucapan mereka membuat engkau (Nabi Muhammad) bersedih hati. Sesungguhnya Kami mengetahui apa yang mereka rahasiakan dan apa yang mereka nyatakan.'
      },
      {
        id: 'ys-77',
        title: 'Ayat 77',
        arabic: 'اَوَلَمْ يَرَ الْاِنْسَانُ اَنَّا خَلَقْنٰهُ مِنْ نُّطْفَةٍ فَاِذَا هُوَ خَصِيْمٌ مُّبِيْنٌ',
        transliteration: 'Awalam yaral-insānu annā khalaqnāhu min nuṭfatin fa\'iżā huwa khaṣīmum mubīn(un).',
        translation: 'Tidakkah manusia mengetahui bahwa Kami menciptakannya dari setetes mani? Kemudian tiba-tiba saja dia menjadi musuh yang nyata.'
      },
      {
        id: 'ys-78',
        title: 'Ayat 78',
        arabic: 'وَضَرَبَ لَنَا مَثَلًا وَّنَسِيَ خَلْقَهٗۗ قَالَ مَنْ يُّحْيِ الْعِظَامَ وَهِيَ رَمِيْمٌ',
        transliteration: 'Wa ḍaraba lanā maṡalaw wa nasiya khalqah(ū), qāla may yuḥyil-‘iẓāma wa hiya ramīm(un).',
        translation: 'Dia membuat perumpamaan bagi Kami dan melupakan asal penciptaannya. Dia berkata, “Siapakah yang bisa menghidupkan tulang-belulang yang telah hancur luluh?”'
      },
      {
        id: 'ys-79',
        title: 'Ayat 79',
        arabic: 'قُلْ يُحْيِيْهَا الَّذِيْٓ اَنْشَاَهَآ اَوَّلَ مَرَّةٍ ۗوَهُوَ بِكُلِّ خَلْقٍ عَلِيْمٌ ۙ',
        transliteration: 'Qul yuḥyīhal-lażī ansya\'ahā awwala marrah(tin), wa huwa bikulli khalqin ‘alīm(un).',
        translation: 'Katakanlah (Nabi Muhammad), “Yang akan menghidupkannya adalah Zat yang menciptakannya pertama kali. Dia Maha Mengetahui setiap makhluk.'
      },
      {
        id: 'ys-80',
        title: 'Ayat 80',
        arabic: ' ۨالَّذِيْ جَعَلَ لَكُمْ مِّنَ الشَّجَرِ الْاَخْضَرِ نَارًاۙ فَاِذَآ اَنْتُمْ مِّنْهُ تُوْقِدُوْنَ',
        transliteration: 'Allażī ja‘ala lakum minasy-syajaril-akhḍari nārā(n), fa\'iżā antum minhu tūqidūn(a).',
        translation: '(Dialah) yang menjadikan api untukmu dari kayu yang hijau. Kemudian, seketika itu kamu menyalakan (api) darinya.”'
      },
      {
        id: 'ys-81',
        title: 'Ayat 81',
        arabic: 'اَوَلَيْسَ الَّذِيْ خَلَقَ السَّمٰوٰتِ وَالْاَرْضَ بِقٰدِرٍ عَلٰٓى اَنْ يَّخْلُقَ مِثْلَهُمْ ۗبَلٰى وَهُوَ الْخَلّٰقُ الْعَلِيْمُ',
        transliteration: 'Awa laisal-lażī khalaqas-samāwāti wal-arḍa biqādirin ‘alā ay yakhluqa miṡlahum, balā wa huwal-khallāqul-‘alīm(u).',
        translation: 'Bukankah Zat yang menciptakan langit dan bumi mampu menciptakan manusia yang serupa mereka itu (di akhirat kelak)? Benar. Dialah yang Maha Banyak Mencipta lagi Maha Mengetahui.'
      },
      {
        id: 'ys-82',
        title: 'Ayat 82',
        arabic: 'اِنَّمَآ اَمْرُهٗٓ اِذَآ اَرَادَ شَيْـًٔاۖ اَنْ يَّقُوْلَ لَهٗ كُنْ فَيَكُوْنُ',
        transliteration: 'Innamā amruhū iżā arāda syai\'an ay yaqūla lahū kun fa yakūn(u).',
        translation: 'Sesungguhnya ketetapan-Nya, jika Dia menghendaki sesuatu, Dia hanya berkata kepadanya, “Jadilah!” Maka, jadilah (sesuatu) itu.'
      },
      {
        id: 'ys-83',
        title: 'Ayat 83',
        arabic: 'فَسُبْحٰنَ الَّذِيْ بِيَدِهٖ مَلَكُوْتُ كُلِّ شَيْءٍ وَّاِلَيْهِ تُرْجَعُوْنَ ࣖ',
        transliteration: 'Fa subḥānal-lażī biyadihī malakūtu kulli syai\'iw wa ilaihi turja‘ūn(a).',
        translation: 'Maka, Maha Suci (Allah) yang di tangan-Nya kekuasaan atas segala sesuatu dan kepada-Nya kamu dikembalikan.'
      }
    ]
  }
];

// Validate readings data at load/build time to ensure early failure if content is invalid
export const readingsData: Reading[] = validateReadingsData(rawReadingsData);
