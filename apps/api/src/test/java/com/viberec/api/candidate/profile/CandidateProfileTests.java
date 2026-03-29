package com.viberec.api.candidate.profile;

import static org.assertj.core.api.Assertions.assertThat;

import com.viberec.api.candidate.profile.service.CandidateProfileService;
import com.viberec.api.candidate.profile.web.ProfileCertificationDto;
import com.viberec.api.candidate.profile.web.ProfileEducationDto;
import com.viberec.api.candidate.profile.web.ProfileExperienceDto;
import com.viberec.api.candidate.profile.web.ProfileLanguageDto;
import com.viberec.api.candidate.profile.web.ProfileSkillDto;
import com.viberec.api.candidate.profile.web.SaveCandidateProfileRequest;
import com.viberec.api.support.IntegrationTestBase;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class CandidateProfileTests extends IntegrationTestBase {

    @Autowired
    private CandidateProfileService candidateProfileService;

    @Test
    void savesProfileForFreshlySignedUpCandidate() {
        var account = createCandidateAccount(
                "Profile Kim",
                "profile.kim@example.com",
                "010-2222-1111"
        );

        candidateProfileService.saveProfile(
                account,
                new SaveCandidateProfileRequest(
                        "채용 운영 제품을 빠르고 명확하게 만드는 프런트엔드 개발자입니다.",
                        "복잡한 흐름을 단순한 UI와 명확한 구조로 정리하는 데 강점이 있습니다.",
                        3,
                        List.of(
                                new ProfileEducationDto(
                                        null,
                                        "서린대학교",
                                        "BACHELOR",
                                        "컴퓨터공학과",
                                        LocalDate.of(2018, 3, 1),
                                        LocalDate.of(2022, 2, 28),
                                        "",
                                        0
                                )
                        ),
                        List.of(
                                new ProfileExperienceDto(
                                        null,
                                        "스튜디오 플로우",
                                        "Frontend Engineer",
                                        LocalDate.of(2022, 3, 1),
                                        null,
                                        "지원자와 운영자 대시보드 화면 개선을 담당했습니다.",
                                        0
                                )
                        ),
                        List.of(
                                new ProfileSkillDto(
                                        null,
                                        "React",
                                        "ADVANCED",
                                        3,
                                        0
                                )
                        ),
                        List.<ProfileCertificationDto>of(),
                        List.<ProfileLanguageDto>of()
                )
        );

        var profile = candidateProfileService.getProfile(account);

        assertThat(profile.introductionTemplate())
                .isEqualTo("채용 운영 제품을 빠르고 명확하게 만드는 프런트엔드 개발자입니다.");
        assertThat(profile.careerYears()).isEqualTo(3);
        assertThat(profile.educations()).hasSize(1);
        assertThat(profile.experiences()).hasSize(1);
        assertThat(profile.skills()).hasSize(1);
        assertThat(profile.skills().get(0).skillName()).isEqualTo("React");
    }
}
