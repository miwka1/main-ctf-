package com.example.demo.service;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import com.example.demo.service.UsersService;
import com.fasterxml.jackson.databind.DatabindException;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.transaction.Transactional;

import com.example.demo.service.PromoService;
import com.example.demo.Task;
import com.example.demo.service.TaskService;
import com.example.demo.TaskPWN;
import com.example.demo.service.TaskPWNService;

import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.io.*;
import java.math.BigInteger;

import com.fasterxml.jackson.core.exc.StreamReadException;
import com.fasterxml.jackson.core.type.TypeReference;

@Component
public class DataInitializer implements CommandLineRunner  {

    private final UsersService usersService;
    private final PromoService promoService;
    private final TaskService taskService;
    private final TaskPWNService taskPWNService;

    public DataInitializer(UsersService usersService, PromoService promoService, TaskService taskService, TaskPWNService taskPWNService) {
        this.usersService = usersService;
        this.promoService = promoService;
        this.taskService = taskService;
        this.taskPWNService = taskPWNService;
    }

     public static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));

            // Переводим байты в hex строку
            StringBuilder hexString = new StringBuilder(2 * hashBytes.length);
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0'); // добавляем ведущий 0
                hexString.append(hex);
            }
            return hexString.toString();

        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 не поддерживается", e);
        }
    }

    @Override
    @Transactional
    public void run(String... args) throws StreamReadException, DatabindException, IOException {

        // --- Пользователи ---
        String[][] defaultUsers = {
                {"Агафонов", "Kostыль_2005", "0"},
                {"Бондарчук", "Bondarchurka", "0"},
                {"Брянцев", "3D_Blender", "0"},
                {"Бузулукский", "Sweet_femboy", "0"},
                {"Гавриленко", "Brunette_Gnom", "0"},
                {"Глухов", "Mishka_Knizhka", "0"},
                {"Горбунов", "Megafon", "0"},
                {"Дьяков", "Digital_artist", "0"},
                {"Ермолаева", "CSS3_TS_ES6+", "0"},
                {"Иванов", "Nirvana", "0"},
                {"Кадыров", "RamZan", "0"},
                {"Калимуллина", "Tortik_2005", "0"},
                {"Кириллов", "Nagibator_777", "0"},
                {"Киро", "Sweet_hoe", "0"},
                {"Ларин", "ZovLander", "0"},
                {"Малькова", "Hk79rd", "0"},
                {"Нарханов", "Deputat", "0"},
                {"Овечкина", "Qn48sz", "0"},
                {"Павлов", "Dota_Tarkov", "0"},
                {"Папин", "Gnilaya_Audi_Stepashka_Mamin", "0"},
                {"Поздняков", "Huge_Nose_Jew", "0"},
                {"Савельев", "Gnilaya_BMW", "0"},
                {"Савинов", "Cyber_Drocher", "0"},
                {"Сагдеев", "7.40e", "0"},
                {"Слетков", "Joker", "0"},
                {"Старших", "CSKA_Champions", "0"},
                {"Федотов", "Sleepy_fuck", "0"},
                {"Шангова", "Blonde_Korotыwka", "0"},
                {"Шештанов", "Sleepy", "0"},
                {"test_user_1", "pass_11", "0"},
                {"test_user_2", "pass_12", "0"},
                {"test_user_3", "pass_13", "0"},
                {"test_user_4", "pass_14", "0"},
                {"test_user_5", "pass_15", "0"},
                {"test_user_6", "pass_16", "0"},
                {"test_user_7", "pass_17", "0"},
                {"test_user_8", "pass_18", "0"},
                {"test_user_9", "pass_19", "0"},
                {"test_user_10", "pass_20", "0"},
                {"test_user_11", "pass_22", "0"},
                {"test_user_12", "pass_23", "0"},
                {"test_user_13", "pass_24", "0"},
                {"test_user_14", "pass_25", "0"},
                {"test_user_15", "pass_26", "0"},
                {"test_user_16", "pass_27", "0"},
                {"test_user_17", "pass_28", "0"},
                {"test_user_18", "pass_29", "0"},
                {"test_user_19", "pass_30", "0"},
                {"test_user_20", "pass_31", "0"},
                {"test_user_21", "pass_32", "0"},
                {"test_user_22", "pass_33", "0"},
                {"test_user_23", "pass_34", "0"},
                {"test_user_24", "pass_35", "0"},
                {"test_user_25", "pass_36", "0"},
                {"test_user_26", "pass_37", "0"},
                {"test_user_27", "pass_38", "0"},
                {"test_user_28", "pass_39", "0"},
                {"test_user_29", "pass_40", "0"},
                {"test_user_30", "pass_41", "0"}
        };



        for (String[] data : defaultUsers) {
            String login = data[0];
            String password = data[1];
            int lecturePoints = Integer.parseInt(data[2]);

            if (usersService.getUserByLogin(login).isEmpty()) {
                usersService.createOrUpdateUser(login, password, 0, lecturePoints);
                System.out.println("Добавлен новый пользователь: " + login + " с баллами: " + lecturePoints);
            } else {
                System.out.println("Пользователь уже существует, пропускаем: " + login);
            }
        }


        // --- Промокоды ---
        String[][] defaultPromos = {
                {"CRINGE", "-5"},
                {"MINUS200", "20"},
                {"СОЛНЦЕ", "20"},
                {"OTVET", "10"},
                {"PARAMEFOZ", "21"},
                {"KARLAPINGUS", "17"},
                {"VNIMATELNOST", "5"},
                {"FREE10", "7"},
                {"TIFON", "7"},
                {"MEMNOS", "12"},
                {"ANIGILATION", "8"},
                {"VOTTAKVOT", "1"},
                {"KRAB", "4"},
                {"ISHAK", "2"},
                {"ONEPEACEONELOVE", "22"},
                {"ZA_IMPERATORA!", "13"},
                {"GERMENTIT", "10"},
                {"SAMARA", "5"},
                {"UMBRA5", "5"},
                {"UMBRA10", "11"},
                {"UMBRA15", "14"},
                {"UMBRA20", "21"},
                {"POMOGITE5", "5"},
                {"POMOGITE10", "9"},
                {"POMOGITE15", "16"},
                {"POMOGITE20", "19"},
                {"SPARKI5", "5"},
                {"SPARKI9", "9"},
                {"SPARKI16", "16"},
                {"SPARKI19", "19"},
                {"OPANA", "5"}

        };

        for (String[] data : defaultPromos) {
            String code = data[0];
            int points = Integer.parseInt(data[1]);

            if (promoService.getPromoByName(code).isEmpty()) {
                promoService.createPromo(code, points);
                System.out.println("Добавлен новый промокод: " + code + " (" + points + " баллов)");
            } else {
                System.out.println("Промокод уже существует, пропускаем: " + code);
            }
        }

        // --- Задания ---
        String[][] defaultTasks = {
                {"Задание 1", "100"},
                {"Задание 2", "150"},
                {"Задание 3", "200"},
                {"Задание 4", "250"},
                {"Задание 5", "300"}
        };

        for (String[] data : defaultTasks) {
            String title = data[0];
            int points = Integer.parseInt(data[1]);

            if (taskService.getTaskByTitle(title).isEmpty()) {
                Task task = new Task();
                task.setTitle(title);
                task.setPoints(points);
                task.setSolved(false);
                taskService.createTask(task); // Создание через TaskService
                System.out.println("Добавлено новое задание: " + title + " (" + points + " баллов)");
            } else {
                System.out.println("Задание уже существует, пропускаем: " + title);
            }
        }


        ObjectMapper mapper = new ObjectMapper();

        ClassPathResource resource = new ClassPathResource("pwnTasks.json");

        List<TaskPWN> tasks = mapper.readValue(
                resource.getInputStream(),
                new TypeReference<List<TaskPWN>>() {}
        );

        for (TaskPWN task : tasks) {
                task.setFlag(sha256(task.getFlag()));
            if (taskPWNService.getTaskByTitle(task.getTitle()).isEmpty()) {
                taskPWNService.createTask(task);
                System.out.println("Добавлено новое задание: " + task.getTitle() + " (" + task.getPoints() + " баллов)");
            } else {
                System.out.println("Задание уже существует, пропускаем: " + task.getTitle());
            }
        }

        System.out.println("Импортировано " + tasks.size() + " задач");

    }
}

