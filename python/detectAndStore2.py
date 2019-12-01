import sys
import cv2
import cv2
import numpy as np
from PIL import Image
import dlib
import face_recognition
import glob
import math
import json

def shape_to_normal(shape):
    shape_normal = []
    for i in range(0, 5):
        shape_normal.append((i, (shape.part(i).x, shape.part(i).y)))
    return shape_normal


def get_eyes_nose_dlib(shape):
    nose = shape[4][1]
    left_eye_x = int(shape[3][1][0] + shape[2][1][0]) // 2
    left_eye_y = int(shape[3][1][1] + shape[2][1][1]) // 2
    right_eyes_x = int(shape[1][1][0] + shape[0][1][0]) // 2
    right_eyes_y = int(shape[1][1][1] + shape[0][1][1]) // 2
    return nose, (left_eye_x, left_eye_y), (right_eyes_x, right_eyes_y)


def distance(a, b):
    return np.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)


def cosine_formula(length_line1, length_line2, length_line3):
    cos_a = -(length_line3 ** 2 - length_line2 ** 2 - length_line1 ** 2) / (2 * length_line2 * length_line1)
    return cos_a


def rotate_point(origin, point, angle):
    ox, oy = origin
    px, py = point

    qx = ox + np.cos(angle) * (px - ox) - np.sin(angle) * (py - oy)
    qy = oy + np.sin(angle) * (px - ox) + np.cos(angle) * (py - oy)
    return qx, qy


def is_between(point1, point2, point3, extra_point):
    c1 = (point2[0] - point1[0]) * (extra_point[1] - point1[1]) - (point2[1] - point1[1]) * (
            extra_point[0] - point1[0])
    c2 = (point3[0] - point2[0]) * (extra_point[1] - point2[1]) - (point3[1] - point2[1]) * (
            extra_point[0] - point2[0])
    c3 = (point1[0] - point3[0]) * (extra_point[1] - point3[1]) - (point1[1] - point3[1]) * (
            extra_point[0] - point3[0])
    if (c1 < 0 and c2 < 0 and c3 < 0) or (c1 > 0 and c2 > 0 and c3 > 0):
        return True
    else:
        return False


def getNameOfPerson(rotated):
    allFiles = glob.glob('C:\\Users\\Harsh\\Desktop\\nodejs\\faces\\*.jpg')

    file = 0
    distance = math.inf
    face = ''


    encoding = face_recognition.face_encodings(rotated)
    if len(encoding) == 0:
        return -1
    my_face_encoding = encoding[0]
    while file < len(allFiles):
        unknown_picture = face_recognition.load_image_file(allFiles[file])
        unknown_face_encoding = face_recognition.face_encodings(unknown_picture)[0]

        face_distances = face_recognition.face_distance(list([my_face_encoding]), unknown_face_encoding)
        if face_distances < distance and face_distances <= 0.6:
            distance = face_distances
            face = allFiles[file]
        file += 1

    if distance == math.inf:
        return 0
    else:
        return face.split('\\')[-1].split(' ')[0]


# img = '20181108_130842.jpg'
img = sys.argv[1];
imagePath = 'C:\\Users\\Harsh\\Desktop\\nodejs\\uploads\\' + img
cascPath = "C:\\Users\\Harsh\\Desktop\\nodejs\\python\\haarcascade_frontalface_default.xml"

faceCascade = cv2.CascadeClassifier(cascPath)
image = cv2.imread(imagePath)

image = cv2.resize(image, (1360, 1080))
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

faces = faceCascade.detectMultiScale(
    gray,
    scaleFactor=1.25,
    minNeighbors=5,
    minSize=(30, 30),
    flags = cv2.CASCADE_SCALE_IMAGE
)
#print("Found {0} faces!".format(len(faces)))
for (x, y, w, h) in faces:
    cv2.rectangle(image, (x, y), (x+w, y+h), (255, 255, 255), 2)
    # print(x,y)

names_of_people_detected = []
count = 0
for (x, y, w, h) in faces:
    x = int(x)
    y = int(y)
    w = int(w) + x
    h = int(h) + y
    imgPart = image[y:h, x:w]

    detector = dlib.get_frontal_face_detector()
    predictor = dlib.shape_predictor('C:\\Users\\Harsh\\Desktop\\nodejs\\python\\shape_predictor_5_face_landmarks.dat')

    gray = cv2.cvtColor(imgPart, cv2.COLOR_BGR2GRAY)
    dets = detector(gray, 1)

    num_faces = len(dets)
    if num_faces == 0:
        names_of_people_detected.append("Face Not Detected")
        imgPath = "C:\\Users\\Harsh\\Desktop\\nodejs\\rotated_faces\\" + str(count) + '_' + img
#        cv2.imwrite(imgPath, imgPart)

    else:
        rects = detector(gray, 1)
        if len(rects) > 0:
            for rect in rects:
                x = rect.left()
                y = rect.top()
                w = rect.right()
                h = rect.bottom()
                shape = predictor(gray, rect)

                shape = shape_to_normal(shape)
                nose, left_eye, right_eye = get_eyes_nose_dlib(shape)
                center_of_forehead = ((left_eye[0] + right_eye[0]) // 2, (left_eye[1] + right_eye[1]) // 2)
                center_pred = (int((x + w) / 2), int((y + y) / 2))

                length_line1 = distance(center_of_forehead, nose)
                length_line2 = distance(center_pred, nose)
                length_line3 = distance(center_pred, center_of_forehead)

                cos_a = cosine_formula(length_line1, length_line2, length_line3)
                angle = np.arccos(cos_a)

                rotated_point = rotate_point(nose, center_of_forehead, angle)
                rotated_point = (int(rotated_point[0]), int(rotated_point[1]))
                if is_between(nose, center_of_forehead, center_pred, rotated_point):
                    angle = np.degrees(-angle)
                else:
                    angle = np.degrees(angle)

                M = cv2.getRotationMatrix2D(rotated_point, angle, 1)

                # rotate the image to align the face of the person
                rotated = cv2.warpAffine(imgPart, M, (imgPart.shape[1], imgPart.shape[0]), flags=cv2.INTER_CUBIC)

                nameOfPerson = getNameOfPerson(rotated)
                if nameOfPerson == -1:
                    names_of_people_detected.append("Not Identified")
                    imgPath = "C:\\Users\\Harsh\\Desktop\\nodejs\\not_identified\\ErrorEncodingFace_" + img.split('.')[0] + '_' + str(count) + '.' + img.split('.')[1]
                    cv2.imwrite(imgPath, rotated)
                    continue
                if nameOfPerson == 0:
                    names_of_people_detected.append("Not Identified")
                    imgPath = "C:\\Users\\Harsh\\Desktop\\nodejs\\not_identified\\" + img.split('.')[0] + '_' + str(count) + '.' + img.split('.')[1]
                    cv2.imwrite(imgPath, rotated)
                    continue
                names_of_people_detected.append(nameOfPerson)
                imgPath = "C:\\Users\\Harsh\\Desktop\\nodejs\\rotated_faces\\" + img.split('.')[0] + '_' + str(count) + '_' + nameOfPerson + '.' + img.split('.')[1]
                cv2.imwrite(imgPath, rotated)
    #used to create image name
    count += 1

send = []
send.append(names_of_people_detected)
send.append(img)
# print(send)
print(json.dumps(send))
sys.stdout.flush()
