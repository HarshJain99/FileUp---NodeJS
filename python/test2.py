import face_recognition
import glob
import math
import json

allFiles = glob.glob('..\\faces\\*.jpg')

found = False
file = 0
distance = math.inf
face = '';

picture_of_me = face_recognition.load_image_file("../rotated_faces/9_20181108_130813.jpg")
my_face_encoding = face_recognition.face_encodings(picture_of_me)[0]


while file<len(allFiles):
    unknown_picture = face_recognition.load_image_file(allFiles[file])
    unknown_face_encoding = face_recognition.face_encodings(unknown_picture)[0]

    results = face_recognition.compare_faces([my_face_encoding], unknown_face_encoding)

    face_distances = face_recognition.face_distance(list([my_face_encoding]), unknown_face_encoding)
    if face_distances < distance and face_distances <= 0.6:
        distance = face_distances
        face = allFiles[file]
        print("Could be ", face)
    else:
        print("Not ", allFiles[file])
    file += 1

if distance == math.inf:
    print("Unknown person!")
else:
    print("It's a picture of ", face)
