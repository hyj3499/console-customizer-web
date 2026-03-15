# ==========================================================
# ⚙️ 1. 캐릭터 및 폰트 스타일 정의 (JSON 데이터 기반)
# ==========================================================
# 주인공: 미케지마 마다라
define p = Character("미케지마 마다라",
    who_font="Galmuri14.ttf",
    who_color="#00000000", # 투명
    who_outlines=[(1, "#dddddd", 0, 0)],
    what_font="Galmuri14.ttf",
    what_color="#000000",
    what_outlines=[(1, "#ffffff", 0, 0)],
    window_background=Solid("#ffb6c180") # rgba(255, 182, 193, 0.5) 핑크빛 반투명
)

# 등장인물 1
define c1 = Character("등장인물 1",
    who_font="Mulmaru.ttf",
    who_color="#000000A6", # rgba(0,0,0,0.65)
    what_font="Mulmaru.ttf",
    what_color="#EBEBEB",
    window_background=Solid("#00000080") # rgba(0,0,0,0.5)
)

# 등장인물 2
define c2 = Character("등장인물 2",
    who_font="Mulmaru.ttf",
    who_color="#ffb6c1cc", # rgba(255,182,193,0.8)
    what_font="Mulmaru.ttf",
    what_color="#ffffff",
    window_background=Solid("#ffb6c1cc") 
)

# ==========================================================
# 🎮 2. 게임 시작 지점
# ==========================================================
label start:
    jump event_1

# ==========================================================
# 🎬 3. 이벤트 시나리오 (이벤트 1 ~ 3)
# ==========================================================
label event_1:
    # 🎵 BGM 재생
    play music "domartistudios-magical-wizard-school.mp3" fadein 1.0

    # 1번 씬 (대화)
    scene bg_school # (bgType 참조)
    show p_standing at center # 주인공 스탠딩
    p "ㅇㄴㅇㄴㅇㄴ"

    # 2번 씬 (CG 이미지 출력)
    scene cg_image_1 with dissolve # (src URL 참조)

    # 3번 씬 (CG 상태에서 대화)
    p "ㄴㅇㄹㅇㄴㅇㄴㅇㄴㅇㄴㅇㅇㅇㅇ"

    # 4번 씬 (선택지 분기)
    menu:
        "옵션 1 (선택지 내용 없음)":
            jump event_1_option1
        "옵션 2 (선택지 내용 없음)":
            jump event_1_option2

label event_1_option1:
    p "ㅁㄴㅇㅇㄴㅁㅇㄴㅇㅁㄴ"
    scene cg_image_1 with dissolve
    p "ㅁㄴㅇㅇㅁㄴㅁㄴㅇㅇㄴㅁㅁㄴㅇㅇㅁㄴ"
    p "ㅁㅇㄴㅇㄴㅁㅇㄴㅁㅇㄴㅁ"
    p "ㄴㅇㅁㅇㄴㅇㅁㄴㅇㄴㅁㅇㄴㅁ"
    scene cg_image_1 with dissolve
    p "232323322323"
    jump event_2 # 다음 이벤트로

label event_1_option2:
    show p_standing at center
    p "233223"
    p "32233223"
    scene cg_image_1 with dissolve
    p "1122112212121"
    jump event_2

label event_2:
    play music "kornevmusic-epic-478847.mp3" fadein 1.0
    scene bg_school
    p "ㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴ"
    p ""
    
    # 선택지 분기
    menu:
        "옵션 1":
            jump event_2_option1
        "옵션 2":
            jump event_2_option2

label event_2_option1:
    p "ㅁㄴㅇㅇㄴㅁㅇㄴㅇㅁㄴ"
    scene cg_image_2 with dissolve
    p "ㅁㄴㅇㅇㅁㄴㅁㄴㅇㅇㄴㅁㅁㄴㅇㅇㅁㄴ"
    jump event_3

label event_2_option2:
    show p_standing at center
    p "233223"
    jump event_3

label event_3:
    stop music fadeout 1.0
    scene bg_school
    p ""
    scene cg_image_3 with dissolve
    p "........ 이게 뭐야?"
    
    # 엔딩
    return