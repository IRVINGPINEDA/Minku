package com.makeitweb.coursiteapi.controller;

import com.makeitweb.coursiteapi.dto.CourseDTO;
import com.makeitweb.coursiteapi.dto.UserCourseDTO;
import com.makeitweb.coursiteapi.entity.Document;
import com.makeitweb.coursiteapi.entity.UserCourse;
import com.makeitweb.coursiteapi.entity.course.Category;
import com.makeitweb.coursiteapi.entity.course.Course;
import com.makeitweb.coursiteapi.entity.users.User;
import com.makeitweb.coursiteapi.repository.UserCourseRepository;
import com.makeitweb.coursiteapi.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final CourseService courseService;
    private final UserService userService;
    private final CategoryService categoryService;
    private final DocumentService documentService;
    private final UserCourseRepository userCourseRepository;

    @PutMapping("/course/{id}/status/{value}")
    public ResponseEntity<?> changeCourseStatus(@PathVariable Long id, @PathVariable Integer value) {
        CourseDTO c = courseService.getCourseById(id);
        Map<String, Object> response = new HashMap<>();

        if(c == null) {
            response.put("status", 404);
            response.put("error", "Curso no encontrado");
            return ResponseEntity.badRequest().body(response);
        }

        c.setStatus(value);

        c = courseService.saveCourse(c);
        response.put("status", 200);
        response.put("course", c);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/teacher/{id}/status/{value}")
    public ResponseEntity<?> changeTeacherStatus(@PathVariable Long id, @PathVariable Integer value) {
        User u = userService.getUserById(id);
        Map<String, Object> response = new HashMap<>();

        if (u ==  null) {
            response.put("status", 404);
            response.put("error", "Profesor no encontrado");
            return ResponseEntity.badRequest().body(response);
        }

        if (u.getRole() == 2) {
            u.setStatus(value);
            u = userService.saveUser(u);
            response.put("status", 200);
            response.put("user", u);
            return ResponseEntity.ok(response);
        }

        response.put("status", 500);
        response.put("error", "El usuario no es un profesor");

        return ResponseEntity.badRequest().body(response);
    }

    @GetMapping("/courses")
    public ResponseEntity<?> getCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @GetMapping("/teachers")
    public ResponseEntity<?> getTeachers() {
        return ResponseEntity.ok(userService.getAllTeachers());
    }

    @GetMapping("/teacher/{id}")
    public ResponseEntity<?> getTeacherById(@PathVariable Long id) {
        User t = userService.getUserById(id);
        List<Document> docs = documentService.getDocumentsByTeacher(id);

        Map<String, Object> response = new HashMap<>();

        response.put("teacher", t);
        response.put("documents", docs);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/category/save")
    public ResponseEntity<?> addCategory(@RequestBody Category category) {
        return ResponseEntity.ok(categoryService.saveCategory(category));
    }

    @PutMapping("/category/update")
    public ResponseEntity<?> updateCategory(@RequestBody Category category) {
        category = categoryService.saveCategory(category);
        if (category == null) {
           return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(category);
    }

    @DeleteMapping("/category/{id}/delete")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        if(!categoryService.deleteCategory(id)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Boolean.TRUE);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {   
        Integer teachersAccepted = 0;
        Integer teachersRejected = 0;
        Integer teachersPending = 0;
        Integer teachersDeleted = 0;

        Integer coursesAccepted = 0;
        Integer coursesRejected = 0;
        Integer coursesPending = 0;
        Integer coursesDeleted = 0;

        List<Integer> coursesByCategory = new ArrayList<>();

        for(User u : userService.getAllTeachers()) {
            if(u.getStatus() == 1)
                teachersAccepted++;
            else if(u.getStatus() == -1)
                teachersRejected++;
            else if(u.getStatus() == 0)
                teachersPending++;
            else
                teachersDeleted++;
        }

        for(Course c : courseService.getAllCourses()) {
            if(c.getStatus() == 1)
                coursesAccepted++;
            else if(c.getStatus() == -1)
                coursesRejected++;
            else if(c.getStatus() == 0)
                coursesPending++;
            else
                coursesDeleted++;

        }
        Integer aux = 0;
        for(Category ca : categoryService.getAllCategories()) {
            for(Course c : courseService.getAllCourses()) {
                if (c.getCategory().getId().equals(ca.getId())) {
                    aux++;
                }
            }
            coursesByCategory.add((aux));
            aux = 0;
        }

        Map<String, Object> response = new HashMap<>();
        Integer[] stats = new Integer[4];
        stats[0] = teachersAccepted;
        stats[1] = teachersPending;
        stats[2] = teachersRejected;
        stats[3] = teachersDeleted;
        response.put("statsTeachers", stats);

        Integer[] statsC = new Integer[4];
        statsC[0] = coursesAccepted;
        statsC[1] = coursesPending;
        statsC[2] = coursesRejected;
        statsC[3] = coursesDeleted;


        response.put("statsCourses", statsC);
        response.put("coursesCategory", coursesByCategory);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/teacher/new")
    public ResponseEntity<?> createTeacher(@RequestBody User teacher) {
        Map<String, Object> response = new HashMap<>();
        teacher.setRole(2);
        teacher.setStatus(1);
        User saved = userService.saveUser(teacher);
        if (saved == null) {
            response.put("status", 400);
            response.put("error", "El correo ya está registrado o los datos son inválidos.");
            return ResponseEntity.badRequest().body(response);
        }
        response.put("status", 200);
        response.put("teacher", saved);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/course/{id}/reviews")
    public ResponseEntity<?> getCourseReviews(@PathVariable Long id) {
        List<UserCourse> userCourses = userCourseRepository.findReviewsByCourseId(id);
        List<UserCourseDTO> reviews = userCourses.stream().map(uc -> {
            UserCourseDTO dto = new UserCourseDTO();
            dto.setCourseId(uc.getCourse().getId());
            dto.setUserId(uc.getUser().getId());
            dto.setScore(uc.getScore());
            dto.setComment(uc.getComment());
            dto.setUserName(uc.getUser().getName());
            dto.setUserLastName(uc.getUser().getLastName());
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/courses/report")
    public ResponseEntity<?> getCoursesReport() {
        List<Course> all = courseService.getAllCourses().stream()
                .filter(c -> c.getStatus() == 1)
                .sorted(Comparator.comparing(Course::getScore, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        List<Map<String, Object>> report = new ArrayList<>();
        for (Course c : all) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("id", c.getId());
            entry.put("title", c.getTitle());
            entry.put("score", c.getScore());
            entry.put("image", c.getImage());
            entry.put("teacher", c.getTeacher().getName() + " " + c.getTeacher().getLastName());
            List<UserCourse> reviews = userCourseRepository.findReviewsByCourseId(c.getId());
            long totalViews = reviews.size();
            List<Map<String, Object>> commentList = reviews.stream()
                    .filter(r -> r.getComment() != null && !r.getComment().trim().isEmpty())
                    .map(r -> {
                        Map<String, Object> cm = new HashMap<>();
                        cm.put("user", r.getUser().getName() + " " + r.getUser().getLastName());
                        cm.put("score", r.getScore());
                        cm.put("comment", r.getComment());
                        return cm;
                    }).collect(Collectors.toList());
            entry.put("totalRatings", totalViews);
            entry.put("comments", commentList);
            report.add(entry);
        }
        return ResponseEntity.ok(report);
    }
}
