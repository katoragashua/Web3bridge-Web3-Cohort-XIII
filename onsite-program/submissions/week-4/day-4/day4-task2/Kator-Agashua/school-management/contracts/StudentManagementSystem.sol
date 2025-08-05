// A smart contract for a Student Management System

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

contract StudentManagementSystem {
    // An enum for student status
    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    // An enum for student gender
    enum Gender {
        MALE,
        FEMALE
    }
    // A nonce to ensure unique IDs
    // This is not strictly necessary for the current implementation, but can be useful for future extensions
    // or to prevent replay attacks in a more complex contract.
    // It is initialized to 0 and can be incremented as needed.
    // In this contract, it is not used directly, but it can be useful for generating
    // unique identifiers or for other purposes in future implementations.
    uint256 private nonce = 0;

    // A student struct
    struct Student {
        uint256 id;
        string name;
        uint256 age;
        Gender gender;
        Status status;
    }

    // An array to hold student structs
    Student[] public studentList;

    mapping(address => Student) student;

    // Function to add student
    function addStudent(
        address _address,
        string memory _name,
        uint256 _age,
        Gender _gender,
        Status _status
    ) external {
        nonce++; // Increment nonce to ensure unique ID
        if (student[_address].id != 0) revert("Student already exists");
        uint256 _id = uint256((keccak256(abi.encodePacked(_name, nonce))));
        student[_address] = Student(_id, _name, _age, _gender, _status);
        studentList.push(Student(_id, _name, _age, _gender, _status));
    }

    // Function to update student data
    function updateStudent(
        address _address,
        string memory _name,
        uint256 _age,
        Status _status
    ) external {
        if (bytes(_name).length != 0 && (_age > 0)) {
            student[_address].name = _name;
            student[_address].age = _age;
            student[_address].status = _status;
        }
        revert("Couldn't update");
    }

    // Function to get student by id
    function getStudent(address _address)
        external
        view
        returns (
            string memory,
            uint256,
            uint256,
            string memory,
            string memory
        )
    {
        return (
            student[_address].name,
            student[_address].id,
            student[_address].age,
            GenderToString(student[_address].gender),
            StatusToString(student[_address].status)
        );
    }

    // Function to delete student
    function deleteStudent(address _address) external {
        uint256 _id = student[_address].id;
        uint256 index;
        delete student[_address];
        for (uint256 i = 0; i < studentList.length; i++) {
            if (studentList[i].id == _id) {
                index = i;
            }
        }

        for (uint256 i = index; i < studentList.length - 1; i++) {
            studentList[i] = studentList[i + 1];
        }

        studentList.pop();
    }

    // Function to get the total number of students
    function getTotalStudents() external view returns (uint256) {
        return studentList.length;
    }

    // Function to get all students
    function getAllStudents() external view returns (Student[] memory) {
        return studentList;
    }

    function GenderToString(Gender _gender)
        public
        pure
        returns (string memory)
    {
        string memory gender = _gender == Gender.MALE ? "MALE" : "FEMALE";
        return gender;
    }

    function StatusToString(Status _status)
        public
        pure
        returns (string memory)
    {
        string memory status;
        if (_status == Status.ACTIVE) {
            status = "ACTIVE";
        } else if (_status == Status.DEFERRED) {
            status = "DEFERRED";
        } else {
            status = "RUSTICATED";
        }
        return status;
    }
}
