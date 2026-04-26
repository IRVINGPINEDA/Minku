package com.makeitweb.coursiteapi.config;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class S3Config {

    @Value("${aws.s3.region:us-east-1}")
    private String region;

    @Value("${aws.access.key.id:}")
    private String accessKeyId;

    @Value("${aws.secret.access.key:}")
    private String secretAccessKey;

    @Bean
    public AmazonS3 amazonS3() {
        AmazonS3ClientBuilder builder = AmazonS3ClientBuilder.standard().withRegion(region);
        if (!accessKeyId.isEmpty() && !secretAccessKey.isEmpty()) {
            builder.withCredentials(new AWSStaticCredentialsProvider(
                new BasicAWSCredentials(accessKeyId, secretAccessKey)
            ));
        } else {
            // Si la EC2 tiene un IAM Role con permisos S3, no se necesitan credenciales explícitas
            builder.withCredentials(DefaultAWSCredentialsProviderChain.getInstance());
        }
        return builder.build();
    }
}
