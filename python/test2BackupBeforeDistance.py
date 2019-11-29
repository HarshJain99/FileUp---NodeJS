import face_recognition
import glob

allFiles = glob.glob('..\\faces\\*.jpg')

found = False
file = 0
while not found and file<len(allFiles):
    picture_of_me = face_recognition.load_image_file("../rotated_faces/9_20181108_130813.jpg")
    my_face_encoding = face_recognition.face_encodings(picture_of_me)[0]

    # my_face_encoding now contains a universal 'encoding' of my facial features that can be compared to any other picture of a face!

    unknown_picture = face_recognition.load_image_file(allFiles[file])
    unknown_face_encoding = face_recognition.face_encodings(unknown_picture)[0]

    # Now we can see the two face encodings are of the same person with `compare_faces`!
    results = face_recognition.compare_faces([my_face_encoding], unknown_face_encoding)

    if results[0]:
        print("It's a picture of ", allFiles[file])
        found = True
        break
    else:
        print("Not ", allFiles[file])
        file += 1
if not found:
    print("Unknown person!")