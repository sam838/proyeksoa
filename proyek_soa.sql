/*
SQLyog Professional v13.1.1 (32 bit)
MySQL - 10.4.11-MariaDB : Database - proyek_soa
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`proyek_soa` /*!40100 DEFAULT CHARACTER SET utf8mb4 */;

USE `proyek_soa`;

/*Table structure for table `cuaca` */

DROP TABLE IF EXISTS `cuaca`;

CREATE TABLE `cuaca` (
  `id_cuaca` varchar(255) NOT NULL,
  `country` varchar(255) DEFAULT NULL,
  `temp` varchar(255) DEFAULT NULL,
  `clouds` varchar(255) DEFAULT NULL,
  `humidity` varchar(255) DEFAULT NULL,
  `pressure` varchar(255) DEFAULT NULL,
  `wind_direction` varchar(255) DEFAULT NULL,
  `wind_speed` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_cuaca`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/*Data for the table `cuaca` */

/*Table structure for table `cuaca_user` */

DROP TABLE IF EXISTS `cuaca_user`;

CREATE TABLE `cuaca_user` (
  `id_cuaca_user` varchar(255) NOT NULL,
  `foto_cuaca` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `deskripsi_cuaca` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_cuaca_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/*Data for the table `cuaca_user` */

insert  into `cuaca_user`(`id_cuaca_user`,`foto_cuaca`,`email`,`deskripsi_cuaca`) values 
('Surabaya','/uploads/posts/Surabaya.png','undefined','Cuaca hari ini panas');

/*Table structure for table `user` */

DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  `email` varchar(255) NOT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `saldo` int(255) NOT NULL,
  `api_hit` int(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/*Data for the table `user` */

insert  into `user`(`email`,`nama`,`password`,`saldo`,`api_hit`,`status`) values 
('a@a.com','a','2',180000,20,'approve'),
('b@b.com','b','1',0,0,'approve');

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
