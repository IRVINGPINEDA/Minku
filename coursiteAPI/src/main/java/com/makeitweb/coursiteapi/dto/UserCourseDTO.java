package com.makeitweb.coursiteapi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserCourseDTO {
    private Long courseId;
    private Long userId;
    private Float progress;
    private Float score;
    private String comment;
    private String userName;
    private String userLastName;

    private CourseDTO course;
}